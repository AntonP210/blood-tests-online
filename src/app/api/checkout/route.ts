import { NextResponse } from "next/server";
import { checkoutRequestSchema } from "@/lib/validators";
import { getAuthenticatedUserId } from "@/lib/usage-tracker";
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

    let userId: string;
    try {
      userId = await getAuthenticatedUserId();
    } catch {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier } = checkoutRequestSchema.parse(body);
    const locale = body.locale || "en";

    const url = await createCheckoutSession(tier, userId, appUrl, locale);

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
