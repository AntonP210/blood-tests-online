import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to test verifyWebhookSignature. It uses crypto.subtle which is
// available in Node 18+. We test it end-to-end with a known secret.

describe("verifyWebhookSignature", () => {
  const WEBHOOK_SECRET = "test-secret-key-for-hmac";

  beforeEach(() => {
    vi.stubEnv("LEMONSQUEEZY_WEBHOOK_SECRET", WEBHOOK_SECRET);
  });

  async function computeHmac(body: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  it("returns true for a valid signature", async () => {
    const { verifyWebhookSignature } = await import("@/lib/lemonsqueezy");
    const body = '{"event":"order_created","data":{}}';
    const signature = await computeHmac(body, WEBHOOK_SECRET);

    const result = await verifyWebhookSignature(body, signature);
    expect(result).toBe(true);
  });

  it("returns false for an invalid signature", async () => {
    const { verifyWebhookSignature } = await import("@/lib/lemonsqueezy");
    const body = '{"event":"order_created","data":{}}';

    const result = await verifyWebhookSignature(body, "invalid_signature_hex");
    expect(result).toBe(false);
  });

  it("returns false for a tampered body", async () => {
    const { verifyWebhookSignature } = await import("@/lib/lemonsqueezy");
    const originalBody = '{"event":"order_created","data":{}}';
    const signature = await computeHmac(originalBody, WEBHOOK_SECRET);
    const tamperedBody = '{"event":"order_created","data":{"hacked":true}}';

    const result = await verifyWebhookSignature(tamperedBody, signature);
    expect(result).toBe(false);
  });

  it("returns false for a signature computed with wrong secret", async () => {
    const { verifyWebhookSignature } = await import("@/lib/lemonsqueezy");
    const body = '{"event":"order_created"}';
    const wrongSignature = await computeHmac(body, "wrong-secret");

    const result = await verifyWebhookSignature(body, wrongSignature);
    expect(result).toBe(false);
  });

  it("returns false for empty signature", async () => {
    const { verifyWebhookSignature } = await import("@/lib/lemonsqueezy");
    const body = '{"event":"order_created"}';

    const result = await verifyWebhookSignature(body, "");
    expect(result).toBe(false);
  });

  it("handles empty body", async () => {
    const { verifyWebhookSignature } = await import("@/lib/lemonsqueezy");
    const body = "";
    const signature = await computeHmac(body, WEBHOOK_SECRET);

    const result = await verifyWebhookSignature(body, signature);
    expect(result).toBe(true);
  });

  it("throws when LEMONSQUEEZY_WEBHOOK_SECRET is not set", async () => {
    vi.stubEnv("LEMONSQUEEZY_WEBHOOK_SECRET", "");
    // Need fresh import to re-evaluate
    vi.resetModules();
    const { verifyWebhookSignature } = await import("@/lib/lemonsqueezy");

    await expect(
      verifyWebhookSignature("body", "sig")
    ).rejects.toThrow("LEMONSQUEEZY_WEBHOOK_SECRET");
  });
});
