import { test, expect } from "@playwright/test";
import {
  setupApiMocks,
  mockAuthenticatedSession,
  MOCK_USAGE_PAID,
  MOCK_USAGE_EXHAUSTED,
  MOCK_ANALYSIS_RESULT,
} from "./helpers";

/** Usage state for active subscription */
const MOCK_SUBSCRIPTION_ACTIVE = {
  used: 15,
  limit: 2,
  remaining: -1,
  isPaid: true,
  subscriptionStatus: "active",
};

/** Usage state after subscription is cancelled */
const MOCK_SUBSCRIPTION_CANCELLED = {
  used: 15,
  limit: 2,
  remaining: 0,
  isPaid: false,
  subscriptionStatus: "none",
};

/** Usage for one-time credit holder */
const MOCK_ONE_CREDIT = {
  used: 2,
  limit: 2,
  remaining: 1,
  isPaid: true,
  subscriptionStatus: "none",
};

/** Usage after one-time credit used */
const MOCK_NO_CREDITS = {
  used: 3,
  limit: 2,
  remaining: 0,
  isPaid: false,
  subscriptionStatus: "none",
};

test.describe("Post-purchase: usage indicator states", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("active subscription shows 'Unlimited' on analyze page", async ({
    page,
  }) => {
    await setupApiMocks(page, { usage: MOCK_SUBSCRIPTION_ACTIVE });
    await page.goto("/en/analyze");

    await expect(page.getByText("Unlimited")).toBeVisible();
  });

  test("one-time credit holder does NOT show 'Unlimited'", async ({
    page,
  }) => {
    await setupApiMocks(page, { usage: MOCK_ONE_CREDIT });
    await page.goto("/en/analyze");

    await expect(page.getByText("Unlimited")).not.toBeVisible();
  });

  test("exhausted free user shows zero remaining with red styling", async ({
    page,
  }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_EXHAUSTED });
    await page.goto("/en/analyze");

    // Should show the no-analyses-left indicator
    const indicator = page.locator(".border-red-200, .border-red-900\\/50");
    await expect(indicator.first()).toBeVisible();
  });
});

test.describe("Post-purchase: subscription lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("active subscription → analyze succeeds without 402", async ({
    page,
  }) => {
    await setupApiMocks(page, {
      usage: MOCK_SUBSCRIPTION_ACTIVE,
      analysisResult: MOCK_ANALYSIS_RESULT,
    });

    await page.goto("/en/analyze");

    // Fill and submit form
    await page.getByRole("spinbutton", { name: "Age" }).fill("45");
    await page.locator("#gender").click();
    await page.getByRole("option", { name: "Female", exact: true }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "bloodwork.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(8000, "x"),
    });
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    // Should navigate to results (no upgrade modal)
    await page.waitForURL("**/analyze/results", { timeout: 10000 });
    await expect(page.getByText("Hemoglobin", { exact: true })).toBeVisible();
  });

  test("cancelled subscription → 402 triggers upgrade modal", async ({
    page,
  }) => {
    await setupApiMocks(page, {
      usage: MOCK_SUBSCRIPTION_CANCELLED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
    });

    await page.goto("/en/analyze");

    // Fill and submit form
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

    // Should show upgrade modal
    await expect(
      page.getByText("You've used all your free analyses")
    ).toBeVisible({ timeout: 10000 });
  });

  test("paid user can submit multiple analyses without hitting limits", async ({
    page,
  }) => {
    let analyzeCallCount = 0;
    await setupApiMocks(page, {
      usage: MOCK_SUBSCRIPTION_ACTIVE,
    });

    // Count analyze calls
    await page.route("**/api/analyze", async (route) => {
      analyzeCallCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ANALYSIS_RESULT),
      });
    });

    await page.goto("/en/analyze");

    // First analysis
    await page.getByRole("spinbutton", { name: "Age" }).fill("30");
    await page.locator("#gender").click();
    await page.getByRole("option", { name: "Male", exact: true }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test1.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(8000, "a"),
    });
    await page.getByRole("button", { name: /Analyze My Results/i }).click();
    await page.waitForURL("**/analyze/results", { timeout: 10000 });

    expect(analyzeCallCount).toBe(1);

    // Go back and do another analysis
    await page.goto("/en/analyze");
    await page.getByRole("spinbutton", { name: "Age" }).fill("35");
    await page.locator("#gender").click();
    await page.getByRole("option", { name: "Female", exact: true }).click();
    await fileInput.setInputFiles({
      name: "test2.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(8000, "b"),
    });
    await page.getByRole("button", { name: /Analyze My Results/i }).click();
    await page.waitForURL("**/analyze/results", { timeout: 10000 });

    expect(analyzeCallCount).toBe(2);
  });
});

test.describe("Post-purchase: payment page navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("success page 'Start Analyzing' navigates to analyze page", async ({
    page,
  }) => {
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

    await page.route("**/api/usage", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SUBSCRIPTION_ACTIVE),
      });
    });

    await page.getByRole("button", { name: /Start Analyzing/i }).click();
    await page.waitForURL("**/analyze");
  });

  test("failed verification 'Return to Pricing' navigates to pricing page", async ({
    page,
  }) => {
    await page.route("**/api/checkout/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verified: false }),
      });
    });

    await page.goto("/en/payment/success");
    await expect(page.getByText("Payment Not Verified")).toBeVisible({
      timeout: 20000,
    });

    await page.getByRole("button", { name: /Return to Pricing/i }).click();
    await page.waitForURL("**/pricing");
  });

  test("cancel page 'Return to Pricing' navigates to pricing page", async ({
    page,
  }) => {
    await page.goto("/en/payment/cancel");
    await expect(page.getByText("Payment Cancelled")).toBeVisible();

    await page.getByRole("button", { name: /Return to Pricing/i }).click();
    await page.waitForURL("**/pricing");
  });

  test("cancel page 'Try Free Analysis' navigates to analyze page", async ({
    page,
  }) => {
    await setupApiMocks(page);
    await page.goto("/en/payment/cancel");

    await page.getByRole("button", { name: /Try Free Analysis/i }).click();
    await page.waitForURL("**/analyze");
  });
});
