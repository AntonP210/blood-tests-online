import { test, expect } from "@playwright/test";
import {
  setupApiMocks,
  mockAuthenticatedSession,
  MOCK_USAGE_FREE,
  MOCK_USAGE_EXHAUSTED,
} from "./helpers";

const LEMONSQUEEZY_CHECKOUT_URL =
  "https://example.lemonsqueezy.com/checkout/test-onetime";

/** Mock usage for a user who bought a one-time credit (1 remaining) */
const MOCK_USAGE_ONE_TIME_CREDIT = {
  used: 2,
  limit: 2,
  remaining: 1,
  isPaid: true,
  subscriptionStatus: "none",
};

/** Mock usage after one-time credit is consumed */
const MOCK_USAGE_CREDIT_DEPLETED = {
  used: 3,
  limit: 2,
  remaining: 0,
  isPaid: false,
  subscriptionStatus: "none",
};

/** Mock usage for lifetime user */
const MOCK_USAGE_LIFETIME = {
  used: 50,
  limit: 2,
  remaining: -1,
  isPaid: true,
  subscriptionStatus: "active",
};

test.describe("One-time purchase flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("one-time purchase: pricing → Buy Now → checkout → success → 1 credit", async ({
    page,
  }) => {
    // Start as free user
    await setupApiMocks(page, {
      usage: MOCK_USAGE_FREE,
      checkoutUrl: LEMONSQUEEZY_CHECKOUT_URL,
    });

    await page.goto("/en/pricing");

    // Intercept checkout to verify tier
    let checkoutTier: string | null = null;
    await page.route("**/api/checkout", async (route) => {
      checkoutTier = route.request().postDataJSON().tier;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: LEMONSQUEEZY_CHECKOUT_URL }),
      });
    });

    // Intercept navigation to LemonSqueezy so the page doesn't actually leave
    await page.route("**/example.lemonsqueezy.com/**", async (route) => {
      await route.abort();
    });

    // Find the one-time plan ($2.99) and click Buy Now
    const buyNowButtons = page.getByRole("button", { name: "Buy Now" });
    // One-time is the first "Buy Now" button (Lifetime also has Buy Now)
    await buyNowButtons.first().click();

    // Wait for the checkout API call to resolve
    await page.waitForTimeout(500);
    expect(checkoutTier).toBe("one_time");

    // Simulate return from LemonSqueezy → success page
    await page.route("**/api/checkout/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verified: true }),
      });
    });

    await page.goto("/en/payment/success");
    await expect(page.getByText("Payment Successful!")).toBeVisible({
      timeout: 15000,
    });

    // Navigate to analyze — mock usage with 1 credit
    await page.route("**/api/usage", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USAGE_ONE_TIME_CREDIT),
      });
    });

    await page.getByRole("button", { name: /Start Analyzing/i }).click();
    await page.waitForURL("**/analyze");

    // Should NOT show "Unlimited" — one-time credit shows remaining count
    await expect(page.getByText("Unlimited")).not.toBeVisible();
  });

  test("one-time credit consumed → triggers upgrade modal on next attempt", async ({
    page,
  }) => {
    // User has 1 credit left
    await setupApiMocks(page, {
      usage: MOCK_USAGE_ONE_TIME_CREDIT,
    });

    // First analysis succeeds, consuming the credit
    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: "Results look normal.",
          markers: [
            {
              name: "Hemoglobin",
              value: 14.0,
              unit: "g/dL",
              normalRange: "12.0-17.5",
              status: "normal",
              explanation: "Normal hemoglobin levels.",
            },
          ],
          recommendations: ["Continue healthy lifestyle."],
          disclaimer: "AI-generated, not medical advice.",
        }),
      });
    });

    await page.goto("/en/analyze");

    // Fill form and submit
    await page.getByRole("spinbutton", { name: "Age" }).fill("30");
    await page.locator("#gender").click();
    await page.getByRole("option", { name: "Male", exact: true }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(8000, "a"),
    });
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    // Should redirect to results (credit consumed successfully)
    await page.waitForURL("**/analyze/results", { timeout: 10000 });

    // Now go back to analyze — credit is depleted
    // Update mocks: usage exhausted, next analysis returns 402
    await page.route("**/api/usage", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USAGE_CREDIT_DEPLETED),
      });
    });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 402,
        contentType: "application/json",
        body: JSON.stringify({ error: "Free tier limit reached" }),
      });
    });

    await page.goto("/en/analyze");

    // Fill form again
    await page.getByRole("spinbutton", { name: "Age" }).fill("30");
    await page.locator("#gender").click();
    await page.getByRole("option", { name: "Male", exact: true }).click();
    await fileInput.setInputFiles({
      name: "test2.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(8000, "b"),
    });
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    // Should show upgrade modal
    await expect(
      page.getByText("You've used all your free analyses")
    ).toBeVisible({ timeout: 10000 });
  });

  test("lifetime purchase: pricing → Buy Now → checkout → success → unlimited", async ({
    page,
  }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_FREE,
      checkoutUrl: LEMONSQUEEZY_CHECKOUT_URL,
    });

    await page.goto("/en/pricing");

    let checkoutTier: string | null = null;
    await page.route("**/api/checkout", async (route) => {
      checkoutTier = route.request().postDataJSON().tier;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: LEMONSQUEEZY_CHECKOUT_URL }),
      });
    });

    // Intercept navigation to LemonSqueezy
    await page.route("**/example.lemonsqueezy.com/**", async (route) => {
      await route.abort();
    });

    // Lifetime is the last "Buy Now" button (after one-time)
    const buyNowButtons = page.getByRole("button", { name: "Buy Now" });
    await buyNowButtons.last().click();

    await page.waitForTimeout(500);
    expect(checkoutTier).toBe("lifetime");

    // Simulate success
    await page.route("**/api/checkout/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verified: true }),
      });
    });

    await page.goto("/en/payment/success");
    await expect(page.getByText("Payment Successful!")).toBeVisible({
      timeout: 15000,
    });

    // Navigate to analyze — lifetime shows unlimited
    await page.route("**/api/usage", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USAGE_LIFETIME),
      });
    });

    await page.getByRole("button", { name: /Start Analyzing/i }).click();
    await page.waitForURL("**/analyze");

    await expect(page.getByText("Unlimited")).toBeVisible();
  });

  test("cancel page: user cancels payment on LemonSqueezy", async ({
    page,
  }) => {
    await page.goto("/en/payment/cancel");

    await expect(page.getByText("Payment Cancelled")).toBeVisible();
    await expect(
      page.getByText("Your payment was cancelled. No charges were made.")
    ).toBeVisible();

    // Can return to pricing
    const returnBtn = page.getByRole("button", { name: /Return to Pricing/i });
    await expect(returnBtn).toBeVisible();

    // Can try free analysis
    const tryFreeBtn = page.getByRole("button", {
      name: /Try Free Analysis/i,
    });
    await expect(tryFreeBtn).toBeVisible();
  });
});
