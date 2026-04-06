import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import type { PaymentTier } from "@/types/payment";

function setup() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY is not set");
  }
  lemonSqueezySetup({ apiKey });
}

const variantEnvMap: Record<PaymentTier, string> = {
  one_time: "LEMONSQUEEZY_VARIANT_ONE_TIME",
  weekly: "LEMONSQUEEZY_VARIANT_WEEKLY",
  monthly: "LEMONSQUEEZY_VARIANT_MONTHLY",
  yearly: "LEMONSQUEEZY_VARIANT_YEARLY",
  lifetime: "LEMONSQUEEZY_VARIANT_LIFETIME",
};

export function getVariantId(tier: PaymentTier): string {
  const envKey = variantEnvMap[tier];
  const variantId = process.env[envKey];
  if (!variantId) {
    throw new Error(`No LemonSqueezy variant configured for tier: ${tier} (${envKey})`);
  }
  return variantId;
}

export async function createCheckoutSession(
  tier: PaymentTier,
  sessionId: string,
  redirectUrl: string
) {
  setup();

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    throw new Error("LEMONSQUEEZY_STORE_ID is not set");
  }

  const variantId = getVariantId(tier);

  const checkout = await createCheckout(storeId, variantId, {
    checkoutData: {
      custom: {
        session_id: sessionId,
        tier,
      },
    },
    productOptions: {
      redirectUrl: `${redirectUrl}/en/payment/success`,
    },
  });

  return checkout.data?.data.attributes.url;
}

export async function retrieveSubscription(subscriptionId: string) {
  setup();
  const sub = await getSubscription(subscriptionId);
  return sub.data?.data;
}

export async function verifyWebhookSignature(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET is not set");
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const digest = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return digest === signature;
}
