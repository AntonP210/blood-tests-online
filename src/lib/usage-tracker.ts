import { createClient } from "@/lib/supabase/server";
import { getRedis } from "./rate-limit";

const FREE_LIMIT = parseInt(process.env.FREE_ANALYSIS_LIMIT || "2", 10);

/**
 * Get the authenticated user's ID from Supabase.
 * Throws if not authenticated.
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    throw new Error("Authentication required");
  }

  return user.id;
}

/**
 * Get the user's usage count. Checks Redis first, falls back to Postgres.
 */
export async function getUsageCount(userId: string): Promise<number> {
  // Try Redis first
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get<number>(`usage:${userId}`);
    if (cached !== null) return cached;
  }

  // Fall back to Postgres
  const supabase = await createClient();
  const { data } = await supabase
    .from("usage")
    .select("free_analyses_used")
    .eq("user_id", userId)
    .single();

  const count = data?.free_analyses_used ?? 0;

  // Cache in Redis
  if (redis) {
    await redis.set(`usage:${userId}`, count, { ex: 60 * 60 });
  }

  return count;
}

/**
 * Check payment/subscription status. Checks Redis first, falls back to Postgres.
 */
export async function checkPaymentStatus(
  userId: string
): Promise<{
  isPaid: boolean;
  subscriptionStatus: "active" | "inactive" | "none";
}> {
  const redis = getRedis();

  // Check Redis cache first
  if (redis) {
    const [credits, subStatus] = await Promise.all([
      redis.get<number>(`credits:${userId}`),
      redis.get<string>(`subscription:${userId}`),
    ]);

    if (subStatus === "active") {
      return { isPaid: true, subscriptionStatus: "active" };
    }
    if (credits && credits > 0) {
      return { isPaid: true, subscriptionStatus: "none" };
    }
  }

  // Fall back to Postgres
  const supabase = await createClient();
  const { data: payments, error } = await supabase
    .from("payments")
    .select("status, credits_remaining, expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Failed to check payment status:", error);
    throw new Error("Unable to verify payment status. Please try again.");
  }

  if (payments && payments.length > 0) {
    const payment = payments[0];

    if (payment.status === "active") {
      const notExpired =
        !payment.expires_at || new Date(payment.expires_at) > new Date();
      if (notExpired) {
        return { isPaid: true, subscriptionStatus: "active" };
      }
    }

    if (payment.credits_remaining > 0) {
      return { isPaid: true, subscriptionStatus: "none" };
    }
  }

  return { isPaid: false, subscriptionStatus: "none" };
}

/**
 * Atomically check if user can analyze and consume one usage unit.
 * Uses Redis for speed, writes through to Postgres.
 */
export async function tryConsumeUsage(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check subscription first (no consumption needed)
  const payment = await checkPaymentStatus(userId);
  if (payment.subscriptionStatus === "active") {
    return { allowed: true };
  }

  // Check and consume one-time credit (atomic: decrement first, check after)
  const redis = getRedis();
  if (payment.isPaid && redis) {
    const remaining = await redis.decr(`credits:${userId}`);
    if (remaining >= 0) {
      const supabase = await createClient();
      await supabase.rpc("decrement_credits", { p_user_id: userId });
      return { allowed: true };
    }
    // Went negative — restore and fall through
    await redis.incr(`credits:${userId}`);
  }

  // Check free usage limit (atomic: increment first, then check)
  if (redis) {
    const newCount = await redis.incr(`usage:${userId}`);
    if (newCount <= FREE_LIMIT) {
      const supabase = await createClient();
      await supabase.from("usage").upsert(
        {
          user_id: userId,
          free_analyses_used: newCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      return { allowed: true };
    }
    // Over limit — restore and deny
    await redis.decr(`usage:${userId}`);
  } else {
    // No Redis — fall back to Postgres (non-atomic but best effort)
    const usage = await getUsageCount(userId);
    if (usage < FREE_LIMIT) {
      const supabase = await createClient();
      await supabase.from("usage").upsert(
        {
          user_id: userId,
          free_analyses_used: usage + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: "Free analysis limit reached. Please purchase a plan.",
  };
}

/**
 * Refund one usage unit (e.g. when analysis returned no markers).
 */
export async function refundUsage(userId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.decr(`usage:${userId}`);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("usage")
    .select("free_analyses_used")
    .eq("user_id", userId)
    .single();

  if (data && data.free_analyses_used > 0) {
    await supabase.from("usage").update({
      free_analyses_used: data.free_analyses_used - 1,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }
}

export { FREE_LIMIT };
