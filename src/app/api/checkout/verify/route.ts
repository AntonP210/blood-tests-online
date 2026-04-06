import { NextResponse } from "next/server";
import {
  getAuthenticatedUserId,
  checkPaymentStatus,
} from "@/lib/usage-tracker";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    const payment = await checkPaymentStatus(userId);
    const verified =
      payment.subscriptionStatus === "active" || payment.isPaid;

    return NextResponse.json({ verified });
  } catch {
    return NextResponse.json({ verified: false }, { status: 401 });
  }
}
