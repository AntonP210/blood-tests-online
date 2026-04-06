import { NextResponse } from "next/server";
import {
  getAuthenticatedUserId,
  getUsageCount,
  checkPaymentStatus,
  FREE_LIMIT,
} from "@/lib/usage-tracker";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    const used = await getUsageCount(userId);
    const payment = await checkPaymentStatus(userId);

    const remaining = payment.isPaid
      ? -1
      : Math.max(0, FREE_LIMIT - used);

    return NextResponse.json({
      used,
      limit: FREE_LIMIT,
      remaining,
      isPaid: payment.isPaid,
      subscriptionStatus: payment.subscriptionStatus,
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
}
