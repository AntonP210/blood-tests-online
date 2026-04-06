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
  const { data: payments } = await supabase
    .from("payments")
    .select("status, credits_remaining, expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

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

  // Check and consume one-time credit
  const redis = getRedis();
  if (payment.isPaid && redis) {
    const remaining = await redis.decr(`credits:${userId}`);
    if (remaining >= 0) {
      // Also update Postgres
      const supabase = await createClient();
      await supabase.rpc("decrement_credits", { p_user_id: userId });
      return { allowed: true };
    }
    await redis.incr(`credits:${userId}`);
  }

  // Check free usage limit
  const usage = await getUsageCount(userId);
  if (usage < FREE_LIMIT) {
    // Increment in Redis
    if (redis) {
      await redis.incr(`usage:${userId}`);
    }

    // Increment in Postgres (upsert)
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

  return {
    allowed: false,
    reason: "Free analysis limit reached. Please purchase a plan.",
  };
}

/**
 * Migrate anonymous session data to a user account (one-time on first login).
 */
export async function migrateSessionToUser(
  oldSessionId: string,
  userId: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  // Migrate credits
  const credits = await redis.get<number>(`credits:${oldSessionId}`);
  if (credits && credits > 0) {
    await redis.set(`credits:${userId}`, credits);
    await redis.del(`credits:${oldSessionId}`);
  }

  // Migrate subscription
  const sub = await redis.get<string>(`subscription:${oldSessionId}`);
  if (sub === "active") {
    const ttl = await redis.ttl(`subscription:${oldSessionId}`);
    await redis.set(`subscription:${userId}`, "active", {
      ex: ttl > 0 ? ttl : 60 * 60 * 24 * 32,
    });
    await redis.del(`subscription:${oldSessionId}`);
  }

  // Migrate usage count
  const usage = await redis.get<number>(`usage:${oldSessionId}`);
  if (usage) {
    await redis.set(`usage:${userId}`, usage);
    await redis.del(`usage:${oldSessionId}`);
  }
}

export { FREE_LIMIT };
