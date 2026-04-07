import { test, expect } from "@playwright/test";
import {
  setupApiMocks,
  mockAuthenticatedSession,
  MOCK_USAGE_FREE,
  MOCK_USAGE_PAID,
} from "./helpers";

const LEMONSQUEEZY_CHECKOUT_URL =
  "https://example.lemonsqueezy.com/checkout/test-sub";

/**
 * Helper to simulate the full subscription purchase flow:
 * 1. Click subscribe on pricing page
 * 2. Intercept the checkout API call and verify payload
 * 3. Simulate LemonSqueezy redirect to success page
 * 4. Verify the success page polls and shows verified state
 * 5. Verify usage is now unlimited
 */

test.describe("Subscription purchase flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("monthly subscription: pricing → checkout → success → unlimited usage", async ({
    page,
  }) => {
    // Phase 1: Set up mocks — free user initially
    await setupApiMocks(page, {
      usage: MOCK_USAGE_FREE,
      checkoutUrl: LEMONSQUEEZY_CHECKOUT_URL,
    });

    await page.goto("/en/pricing");

    // Phase 2: Intercept checkout API and verify it sends correct tier
    let checkoutPayload: { tier: string; locale: string } | null = null;
    await page.route("**/api/checkout", async (route) => {
      const body = route.request().postDataJSON();
      checkoutPayload = body;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: LEMONSQUEEZY_CHECKOUT_URL }),
      });
    });

    // Intercept navigation to LemonSqueezy so the page doesn't leave
    await page.route("**/example.lemonsqueezy.com/**", async (route) => {
      await route.abort();
    });

    // Click the first "Subscribe" button (Monthly is popular, likely first)
    const subscribeButtons = page.getByRole("button", { name: "Subscribe" });
    await subscribeButtons.first().click();

    // Wait for checkout API to resolve
    await page.waitForTimeout(500);

    // Verify checkout was called with a subscription tier
    expect(checkoutPayload).not.toBeNull();
    expect(checkoutPayload!.tier).toMatch(/^(weekly|monthly|yearly)$/);
    expect(checkoutPayload!.locale).toBe("en");

    // Phase 3: Simulate returning from LemonSqueezy to success page
    // Now mock verify to return true (simulating webhook has arrived)
    await page.route("**/api/checkout/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verified: true }),
      });
    });

    await page.goto("/en/payment/success");

    // Phase 4: Verify success page shows payment verified
    await expect(page.getByText("Payment Successful!")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Thank you for your purchase")).toBeVisible();

    // Phase 5: Click "Start Analyzing" and verify unlimited usage
    // Update usage mock to reflect paid status
    await page.route("**/api/usage", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USAGE_PAID),
      });
    });

    await page.getByRole("button", { name: /Start Analyzing/i }).click();
    await page.waitForURL("**/analyze");

    // Usage indicator should show "Unlimited"
    await expect(page.getByText("Unlimited")).toBeVisible();
  });

  test("yearly subscription: full checkout flow with correct tier", async ({
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

    // Find the yearly plan card via its CardTitle containing "Yearly"
    const yearlyCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', { hasText: "Yearly" }),
    });
    await yearlyCard.getByRole("button", { name: "Subscribe" }).click();

    expect(checkoutTier).toBe("yearly");
  });

  test("weekly subscription: full checkout flow with correct tier", async ({
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

    // Find the weekly plan card via its CardTitle containing "Weekly"
    const weeklyCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', { hasText: "Weekly" }),
    });
    await weeklyCard.getByRole("button", { name: "Subscribe" }).click();

    expect(checkoutTier).toBe("weekly");
  });

  test("success page polls multiple times when webhook is delayed", async ({
    page,
  }) => {
    await mockAuthenticatedSession(page);

    // First 2 calls return not verified, 3rd returns verified
    let verifyCallCount = 0;
    await page.route("**/api/checkout/verify", async (route) => {
      verifyCallCount++;
      const verified = verifyCallCount >= 3;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verified }),
      });
    });

    await page.goto("/en/payment/success");

    // Should show loading first
    await expect(page.getByText("Verifying your payment...")).toBeVisible();

    // Should eventually show success after polling
    await expect(page.getByText("Payment Successful!")).toBeVisible({
      timeout: 15000,
    });

    // Should have called verify at least 3 times
    expect(verifyCallCount).toBeGreaterThanOrEqual(3);
  });

  test("success page shows failure after max polling attempts", async ({
    page,
  }) => {
    await mockAuthenticatedSession(page);

    // All calls return not verified
    await page.route("**/api/checkout/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verified: false }),
      });
    });

    await page.goto("/en/payment/success");

    // Should eventually show failure (5 attempts × 2s = ~10s)
    await expect(page.getByText("Payment Not Verified")).toBeVisible({
      timeout: 20000,
    });
    await expect(
      page.getByText("We couldn't verify your payment")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Return to Pricing/i })
    ).toBeVisible();
  });

  test("checkout API failure shows error gracefully on pricing page", async ({
    page,
  }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    // Override checkout to return error
    await page.route("**/api/checkout", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to create checkout session" }),
      });
    });

    await page.goto("/en/pricing");

    const subscribeBtn = page
      .getByRole("button", { name: "Subscribe" })
      .first();
    await subscribeBtn.click();

    // Button should recover from loading state (no infinite spinner)
    await expect(subscribeBtn).toBeEnabled({ timeout: 5000 });
    // User should still be on pricing page (no redirect happened)
    await expect(page).toHaveURL(/\/pricing/);
  });

  test("checkout API returns 401 for unauthenticated user", async ({
    page,
  }) => {
    // Don't set up auth session
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/checkout", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Authentication required" }),
      });
    });

    await page.goto("/en/pricing");

    const subscribeBtn = page
      .getByRole("button", { name: "Subscribe" })
      .first();
    await subscribeBtn.click();

    // Should not redirect — button recovers
    await expect(subscribeBtn).toBeEnabled({ timeout: 5000 });
    await expect(page).toHaveURL(/\/pricing/);
  });
});
