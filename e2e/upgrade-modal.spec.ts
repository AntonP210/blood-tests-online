import { test, expect } from "@playwright/test";
import {
  setupApiMocks,
  mockAuthenticatedSession,
  MOCK_USAGE_EXHAUSTED,
} from "./helpers";

/**
 * Helper: fill in the analyze form and submit to trigger the 402 -> upgrade modal
 */
async function fillAndSubmitForm(page: import("@playwright/test").Page) {
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
}

test.describe("Upgrade modal", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("appears when analysis returns 402 (usage exhausted)", async ({
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
    await fillAndSubmitForm(page);

    // Modal should be visible
    await expect(
      page.getByText("You've used all your free analyses")
    ).toBeVisible({ timeout: 10000 });

    // Should show pricing tiers (use heading role since tier names are in <h3>)
    await expect(page.getByRole("heading", { name: "One-Time" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Monthly" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Yearly" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lifetime" })).toBeVisible();
  });

  test("can be closed with close button", async ({ page }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
    });

    await page.goto("/en/analyze");
    await fillAndSubmitForm(page);

    await expect(
      page.getByText("You've used all your free analyses")
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Close" }).click();
    await expect(
      page.getByText("You've used all your free analyses")
    ).not.toBeVisible();
  });

  test("can be closed by clicking backdrop", async ({ page }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
    });

    await page.goto("/en/analyze");
    await fillAndSubmitForm(page);

    await expect(
      page.getByText("You've used all your free analyses")
    ).toBeVisible({ timeout: 10000 });

    // Click the backdrop (the semi-transparent overlay)
    await page.locator(".backdrop-blur-sm").click({ force: true, position: { x: 10, y: 10 } });
    await expect(
      page.getByText("You've used all your free analyses")
    ).not.toBeVisible();
  });

  test("shows discount countdown when offer is active", async ({ page }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
      offerActive: true,
    });

    await page.goto("/en/analyze");
    await fillAndSubmitForm(page);

    await expect(
      page.getByText("You've used all your free analyses")
    ).toBeVisible({ timeout: 10000 });

    // Discount badges should be visible
    await expect(page.getByText(/Offer expires in/i)).toBeVisible();
    await expect(page.getByText(/-\d+%/).first()).toBeVisible();
  });

  test("choose plan button triggers checkout", async ({ page }) => {
    await setupApiMocks(page, {
      usage: MOCK_USAGE_EXHAUSTED,
      analysisError: {
        status: 402,
        body: { error: "Free tier limit reached" },
      },
      checkoutUrl: "https://example.lemonsqueezy.com/checkout/test",
    });

    await page.goto("/en/analyze");
    await fillAndSubmitForm(page);

    await expect(
      page.getByText("You've used all your free analyses")
    ).toBeVisible({ timeout: 10000 });

    // Click a plan and wait for the checkout API call
    const checkoutPromise = page.waitForRequest("**/api/checkout");
    await page.getByRole("button", { name: "Choose Plan" }).first().click();
    const req = await checkoutPromise;
    expect(req.method()).toBe("POST");
  });
});
