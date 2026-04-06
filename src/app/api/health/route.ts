import { NextResponse } from "next/server";
import { getRedis } from "@/lib/rate-limit";

export async function GET() {
  const checks: Record<string, "ok" | "unavailable"> = {
    app: "ok",
    redis: "unavailable",
    gemini: process.env.GEMINI_API_KEY ? "ok" : "unavailable",
    lemonsqueezy: process.env.LEMONSQUEEZY_API_KEY ? "ok" : "unavailable",
  };

  try {
    const redis = getRedis();
    if (redis) {
      await redis.ping();
      checks.redis = "ok";
    }
  } catch {
    checks.redis = "unavailable";
  }

  const allHealthy = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { status: allHealthy ? "healthy" : "degraded", checks },
    { status: allHealthy ? 200 : 503 }
  );
}
