import { test, expect } from "@playwright/test";
import {
  setupApiMocks,
  mockAuthenticatedSession,
  MOCK_USAGE_EXHAUSTED,
  MOCK_USAGE_PAID,
} from "./helpers";

const LEMONSQUEEZY_CHECKOUT_URL =
  "https://example.lemonsqueezy.com/checkout/test-upgrade";

/**
 * Helper: fill the analyze form and submit to trigger 402
 */
async function triggerUpgradeModal(page: import("@playwright/test").Page) {
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

  // Wait for upgrade modal
  await expect(
    page.getByText("You've used all your free analyses")
  ).toBeVisible({ timeout: 10000 });
}

test.describe("Upgrade modal → purchase completion", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("upgrade modal: choose monthly plan → checkout → success → analyze with unlimited", async ({
    page,
  }) => {
    // Step 1: Free user with exhausted usage
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
      checkoutUrl: LEMONSQUEEZY_CHECKOUT_URL,
    });

    await page.goto("/en/analyze");
    await triggerUpgradeModal(page);

    // Step 2: Intercept checkout and verify tier from modal
    let checkoutTier: string | null = null;
    await page.route("**/api/checkout", async (route) => {
      checkoutTier = route.request().postDataJSON().tier;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: LEMONSQUEEZY_CHECKOUT_URL }),
      });
    });

    // Intercept navigation to LemonSqueezy so page doesn't leave
    await page.route("**/example.lemonsqueezy.com/**", async (route) => {
      await route.abort();
    });

    // Modal shows 4 tiers: one_time, monthly, yearly, lifetime
    // Target the specific card div containing the Monthly h3
    const monthlyCard = page.locator(".rounded-xl.border").filter({
      has: page.locator("h3", { hasText: "Monthly" }),
    });
    await monthlyCard.getByRole("button", { name: "Choose Plan" }).click();

    // Wait for checkout API call
    await page.waitForTimeout(500);
    expect(checkoutTier).toBe("monthly");

    // Step 3: Simulate return from checkout → success page
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

    // Step 4: Go to analyze — now has unlimited
    await page.route("**/api/usage", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USAGE_PAID),
      });
    });

    // Also update analyze to succeed now
    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: "Results look good.",
          markers: [
            {
              name: "Hemoglobin",
              value: 14.0,
              unit: "g/dL",
              normalRange: "12.0-17.5",
              status: "normal",
              explanation: "Normal.",
            },
          ],
          recommendations: ["Healthy."],
          disclaimer: "AI-generated.",
        }),
      });
    });

    await page.getByRole("button", { name: /Start Analyzing/i }).click();
    await page.waitForURL("**/analyze");

    // Usage indicator shows unlimited
    await expect(page.getByText("Unlimited")).toBeVisible();
  });

  test("upgrade modal: choose one-time plan from modal", async ({ page }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
    });

    await page.goto("/en/analyze");
    await triggerUpgradeModal(page);

    let checkoutTier: string | null = null;
    await page.route("**/api/checkout", async (route) => {
      checkoutTier = route.request().postDataJSON().tier;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: LEMONSQUEEZY_CHECKOUT_URL }),
      });
    });

    // One-Time is the first tier shown in the modal
    const oneTimeCard = page.locator(".rounded-xl.border").filter({
      has: page.locator("h3", { hasText: "One-Time" }),
    });
    await oneTimeCard.getByRole("button", { name: "Choose Plan" }).click();

    await page.waitForTimeout(500);
    expect(checkoutTier).toBe("one_time");
  });

  test("upgrade modal: choose lifetime plan from modal", async ({ page }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
    });

    await page.goto("/en/analyze");
    await triggerUpgradeModal(page);

    let checkoutTier: string | null = null;
    await page.route("**/api/checkout", async (route) => {
      checkoutTier = route.request().postDataJSON().tier;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: LEMONSQUEEZY_CHECKOUT_URL }),
      });
    });

    const lifetimeCard = page.locator(".rounded-xl.border").filter({
      has: page.locator("h3", { hasText: "Lifetime" }),
    });
    await lifetimeCard.getByRole("button", { name: "Choose Plan" }).click();

    await page.waitForTimeout(500);
    expect(checkoutTier).toBe("lifetime");
  });

  test("upgrade modal: choose yearly plan from modal", async ({ page }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
    });

    await page.goto("/en/analyze");
    await triggerUpgradeModal(page);

    let checkoutTier: string | null = null;
    await page.route("**/api/checkout", async (route) => {
      checkoutTier = route.request().postDataJSON().tier;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: LEMONSQUEEZY_CHECKOUT_URL }),
      });
    });

    const yearlyCard = page.locator(".rounded-xl.border").filter({
      has: page.locator("h3", { hasText: "Yearly" }),
    });
    await yearlyCard.getByRole("button", { name: "Choose Plan" }).click();

    await page.waitForTimeout(500);
    expect(checkoutTier).toBe("yearly");
  });

  test("upgrade modal with discount: shows discounted prices and countdown", async ({
    page,
  }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
      offerActive: true,
    });

    await page.goto("/en/analyze");
    await triggerUpgradeModal(page);

    // Should show countdown timer
    await expect(page.getByText(/Offer expires in/i)).toBeVisible();

    // Should show discount badges
    await expect(page.getByText(/-\d+%/).first()).toBeVisible();

    // Original prices should appear with line-through (strikethrough)
    const strikethroughPrices = page.locator(".line-through");
    await expect(strikethroughPrices.first()).toBeVisible();
  });

  test("upgrade modal: checkout failure keeps modal open and recovers", async ({
    page,
  }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
    });

    await page.goto("/en/analyze");
    await triggerUpgradeModal(page);

    // Checkout fails with network error
    await page.route("**/api/checkout", async (route) => {
      await route.abort("connectionrefused");
    });

    const choosePlanBtn = page
      .getByRole("button", { name: "Choose Plan" })
      .first();
    await choosePlanBtn.click();

    // Modal should still be visible (not navigated away)
    await expect(
      page.getByText("You've used all your free analyses")
    ).toBeVisible();

    // Button should recover from loading state
    await expect(choosePlanBtn).toBeEnabled({ timeout: 5000 });
  });
});
