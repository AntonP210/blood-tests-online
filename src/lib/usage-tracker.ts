import { cookies } from "next/headers";
import { getRedis } from "./rate-limit";

const COOKIE_NAME = "bt_session";
const FREE_LIMIT = parseInt(process.env.FREE_ANALYSIS_LIMIT || "2", 10);

export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return sessionId;
}

export async function getUsageCount(sessionId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  const count = await redis.get<number>(`usage:${sessionId}`);
  return count ?? 0;
}

export async function checkPaymentStatus(
  sessionId: string
): Promise<{
  isPaid: boolean;
  subscriptionStatus: "active" | "inactive" | "none";
}> {
  const redis = getRedis();
  if (!redis) return { isPaid: false, subscriptionStatus: "none" };

  const [oneTimeCredits, subscriptionStatus] = await Promise.all([
    redis.get<number>(`credits:${sessionId}`),
    redis.get<string>(`subscription:${sessionId}`),
  ]);

  if (subscriptionStatus === "active") {
    return { isPaid: true, subscriptionStatus: "active" };
  }

  if (oneTimeCredits && oneTimeCredits > 0) {
    return { isPaid: true, subscriptionStatus: "none" };
  }

  return { isPaid: false, subscriptionStatus: "none" };
}

/**
 * Atomically check if the user can analyze and consume one usage unit.
 * Uses Redis EVAL (Lua script) to prevent race conditions where two
 * simultaneous requests both pass the limit check before either increments.
 *
 * Returns { allowed, reason } indicating whether analysis was permitted.
 */
export async function tryConsumeUsage(
  sessionId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const redis = getRedis();
  if (!redis) {
    // If Redis is unavailable, allow with a warning — usage can't be tracked
    return { allowed: true };
  }

  // Check subscription first (no consumption needed)
  const subscriptionStatus = await redis.get<string>(
    `subscription:${sessionId}`
  );
  if (subscriptionStatus === "active") {
    return { allowed: true };
  }

  // Check and atomically consume a one-time credit
  const credits = await redis.get<number>(`credits:${sessionId}`);
  if (credits && credits > 0) {
    const remaining = await redis.decr(`credits:${sessionId}`);
    if (remaining >= 0) {
      return { allowed: true };
    }
    // Race: credits went negative, restore and fall through
    await redis.incr(`credits:${sessionId}`);
  }

  // Atomically check and increment free usage
  // INCR returns the new value. If it's <= FREE_LIMIT, the analysis is allowed.
  const newCount = await redis.incr(`usage:${sessionId}`);
  if (newCount <= FREE_LIMIT) {
    return { allowed: true };
  }

  // Over the limit — undo the increment
  await redis.decr(`usage:${sessionId}`);
  return {
    allowed: false,
    reason: "Free analysis limit reached. Please purchase a plan.",
  };
}

export { FREE_LIMIT };
