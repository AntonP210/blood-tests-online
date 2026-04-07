import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let freeRatelimit: Ratelimit | null = null;
let paidRatelimit: Ratelimit | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

function getFreeRatelimit(): Ratelimit | null {
  if (freeRatelimit) return freeRatelimit;
  const r = getRedis();
  if (!r) return null;
  freeRatelimit = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    prefix: "rl:free",
    analytics: false,
  });
  return freeRatelimit;
}

function getPaidRatelimit(): Ratelimit | null {
  if (paidRatelimit) return paidRatelimit;
  const r = getRedis();
  if (!r) return null;
  paidRatelimit = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(60, "1 h"),
    prefix: "rl:paid",
    analytics: false,
  });
  return paidRatelimit;
}

export async function checkRateLimit(
  identifier: string,
  isPaid = false
): Promise<{ success: boolean; remaining: number }> {
  const rl = isPaid ? getPaidRatelimit() : getFreeRatelimit();

  if (!rl) {
    // Fail-closed: if Redis is not available, reject requests
    // rather than allowing unlimited access
    console.error("Rate limiter unavailable: Redis not configured");
    return { success: false, remaining: 0 };
  }

  const result = await rl.limit(identifier);
  return { success: result.success, remaining: result.remaining };
}

/**
 * Track failed analysis attempts. After too many failures, block the user
 * temporarily to prevent abuse (junk images wasting Gemini API calls).
 * Allows 5 failures per 15 minutes before blocking.
 */
export async function trackFailure(userId: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const key = `failures:${userId}`;
  const count = await r.incr(key);
  if (count === 1) {
    await r.expire(key, 900); // 15 min window
  }
}

export async function isAbuser(userId: string): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  const count = await r.get<number>(`failures:${userId}`);
  return count !== null && count >= 5;
}

export { getRedis };
