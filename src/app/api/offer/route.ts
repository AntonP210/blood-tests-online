import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/usage-tracker";
import { getRedis } from "@/lib/rate-limit";

const OFFER_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    const redis = getRedis();

    if (!redis) {
      return NextResponse.json({ active: false });
    }

    const offerStart = await redis.get<string>(`offer:${userId}`);

    if (!offerStart) {
      return NextResponse.json({ active: false });
    }

    const startTime = parseInt(offerStart, 10);
    const expiresAt = startTime + OFFER_DURATION_MS;
    const now = Date.now();

    if (now >= expiresAt) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: true,
      expiresAt,
      remainingMs: expiresAt - now,
    });
  } catch {
    return NextResponse.json({ active: false });
  }
}
