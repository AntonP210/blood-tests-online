import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRedis } from "@/lib/rate-limit";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";

// Use service role client for webhook (bypasses RLS)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured");
  }
  return createClient(url, key);
}

interface WebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      tier?: string;
    };
  };
  data: {
    id: string;
    attributes: {
      status?: string;
      order_id?: number;
      subscription_id?: number;
      ends_at?: string | null;
      renews_at?: string | null;
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
  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const eventName = event.meta.event_name;
  const eventId = `${eventName}:${event.data.id}`;

  // Idempotency check
  if (redis) {
    const eventKey = `webhook:${eventId}`;
    const alreadyProcessed = await redis.get<string>(eventKey);
    if (alreadyProcessed) {
      return NextResponse.json({ received: true, deduplicated: true });
    }
  }

  try {
    const userId = event.meta.custom_data?.user_id;
    const tier = event.meta.custom_data?.tier;

    if (!userId) {
      console.error("Webhook: missing user_id in custom_data", { eventId });
      if (redis) await redis.set(`webhook:${eventId}`, "1", { ex: 86400 });
      return NextResponse.json({ received: true });
    }

    const supabase = getServiceClient();

    switch (eventName) {
      case "order_created": {
        if (!tier) break;

        if (tier === "lifetime") {
          // Upsert to Postgres (idempotent on webhook retry)
          await supabase.from("payments").upsert({
            user_id: userId,
            tier: "lifetime",
            lemonsqueezy_order_id: String(event.data.id),
            status: "active",
            credits_remaining: 0,
            expires_at: null,
          }, { onConflict: "lemonsqueezy_order_id" });
          // Cache in Redis
          if (redis) {
            await redis.set(`subscription:${userId}`, "active", {
              ex: 60 * 60 * 24 * 365 * 100,
            });
          }
        } else if (tier === "one_time") {
          await supabase.from("payments").upsert({
            user_id: userId,
            tier: "one_time",
            lemonsqueezy_order_id: String(event.data.id),
            status: "active",
            credits_remaining: 1,
          }, { onConflict: "lemonsqueezy_order_id" });
          if (redis) {
            await redis.set(`credits:${userId}`, 1, {
              ex: 60 * 60 * 24 * 30,
            });
          }
        }
        break;
      }

      case "subscription_created":
      case "subscription_updated": {
        const status = event.data.attributes.status;
        const renewsAt = event.data.attributes.renews_at;
        const endsAt = event.data.attributes.ends_at;

        if (status === "active") {
          const expiresAt = renewsAt || endsAt || null;

          // Upsert to Postgres
          await supabase.from("payments").upsert(
            {
              user_id: userId,
              tier: tier || "monthly",
              lemonsqueezy_subscription_id: String(event.data.id),
              status: "active",
              expires_at: expiresAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          // Cache in Redis
          if (redis) {
            let ttl = 60 * 60 * 24 * 32;
            if (expiresAt) {
              const endTime = Math.floor(
                new Date(expiresAt).getTime() / 1000
              );
              const computed =
                endTime - Math.floor(Date.now() / 1000) + 86400;
              if (computed > 0) ttl = computed;
            }
            await redis.set(`subscription:${userId}`, "active", { ex: ttl });
          }
        } else if (status === "cancelled" || status === "expired") {
          await supabase
            .from("payments")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("user_id", userId);

          if (redis) await redis.del(`subscription:${userId}`);
        }
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        await supabase
          .from("payments")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (redis) await redis.del(`subscription:${userId}`);
        break;
      }
    }

    // Mark event as processed
    if (redis) await redis.set(`webhook:${eventId}`, "1", { ex: 86400 });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
