import { NextResponse } from "next/server";
import { getRedis } from "@/lib/rate-limit";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";

interface WebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      session_id?: string;
      tier?: string;
    };
  };
  data: {
    id: string;
    attributes: {
      status?: string;
      ends_at?: string | null;
      renews_at?: string | null;
      first_subscription_item?: {
        current_period_end?: string;
      } | null;
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature header" },
      { status: 400 }
    );
  }

  try {
    const valid = await verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Webhook verification not configured" },
      { status: 500 }
    );
  }

  const redis = getRedis();
  if (!redis) {
    console.error("Redis not available for webhook processing");
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }

  const event: WebhookEvent = JSON.parse(rawBody);
  const eventName = event.meta.event_name;
  const eventId = `${eventName}:${event.data.id}`;

  // Idempotency check
  const eventKey = `webhook:${eventId}`;
  const alreadyProcessed = await redis.get<string>(eventKey);
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  try {
    const sessionId = event.meta.custom_data?.session_id;
    const tier = event.meta.custom_data?.tier;

    if (!sessionId) {
      console.error("Webhook: missing session_id in custom_data", { eventId });
      await redis.set(eventKey, "1", { ex: 60 * 60 * 24 });
      return NextResponse.json({ received: true });
    }

    switch (eventName) {
      case "order_created": {
        if (!tier) break;

        if (tier === "lifetime") {
          // Lifetime: effectively permanent
          await redis.set(`subscription:${sessionId}`, "active", {
            ex: 60 * 60 * 24 * 365 * 100,
          });
        } else if (tier === "one_time") {
          // One-time: 1 credit, expires in 30 days
          await redis.set(`credits:${sessionId}`, 1, {
            ex: 60 * 60 * 24 * 30,
          });
        }
        break;
      }

      case "subscription_created":
      case "subscription_updated": {
        const status = event.data.attributes.status;
        if (status === "active") {
          // Use renews_at or ends_at to calculate TTL
          const renewsAt = event.data.attributes.renews_at;
          const endsAt = event.data.attributes.ends_at;
          const dateStr = renewsAt || endsAt;

          let ttl = 60 * 60 * 24 * 32; // 32-day default
          if (dateStr) {
            const endTime = Math.floor(new Date(dateStr).getTime() / 1000);
            const now = Math.floor(Date.now() / 1000);
            const computed = endTime - now + 86400; // 1-day buffer
            if (computed > 0) ttl = computed;
          }

          await redis.set(`subscription:${sessionId}`, "active", { ex: ttl });
        } else if (status === "cancelled" || status === "expired") {
          await redis.del(`subscription:${sessionId}`);
        }
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        await redis.del(`subscription:${sessionId}`);
        break;
      }
    }

    // Mark event as processed
    await redis.set(eventKey, "1", { ex: 60 * 60 * 24 });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
