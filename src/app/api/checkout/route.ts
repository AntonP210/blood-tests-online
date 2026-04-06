import { NextResponse } from "next/server";
import { checkoutRequestSchema } from "@/lib/validators";
import { getOrCreateSessionId } from "@/lib/usage-tracker";
import { createCheckoutSession } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL is not set");
      return NextResponse.json(
        { error: "Checkout is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { tier } = checkoutRequestSchema.parse(body);

    const sessionId = await getOrCreateSessionId();
    const url = await createCheckoutSession(tier, sessionId, appUrl);

    if (!url) {
      return NextResponse.json(
        { error: "Failed to create checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
