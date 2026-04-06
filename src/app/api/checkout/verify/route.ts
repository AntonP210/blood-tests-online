import { NextResponse } from "next/server";
import { getOrCreateSessionId, checkPaymentStatus } from "@/lib/usage-tracker";

export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId();
    const payment = await checkPaymentStatus(sessionId);

    const verified =
      payment.subscriptionStatus === "active" || payment.isPaid;

    return NextResponse.json({ verified });
  } catch {
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
