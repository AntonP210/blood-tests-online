import { NextResponse } from "next/server";
import {
  getOrCreateSessionId,
  getUsageCount,
  checkPaymentStatus,
  FREE_LIMIT,
} from "@/lib/usage-tracker";

export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId();
    const used = await getUsageCount(sessionId);
    const payment = await checkPaymentStatus(sessionId);

    const remaining = payment.isPaid ? Infinity : Math.max(0, FREE_LIMIT - used);

    return NextResponse.json({
      used,
      limit: FREE_LIMIT,
      remaining: payment.isPaid ? -1 : remaining, // -1 means unlimited
      isPaid: payment.isPaid,
      subscriptionStatus: payment.subscriptionStatus,
    });
  } catch (error) {
    console.error("Usage check error:", error);
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 }
    );
  }
}
