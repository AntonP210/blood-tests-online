import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./helpers";

test.describe("Pricing page", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/en/pricing");
  });

  test("renders pricing page with title", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Simple, Transparent Pricing/i })
    ).toBeVisible();
    await expect(
      page.getByText("Choose the plan that works for you")
    ).toBeVisible();
  });

  test("displays all pricing tier names", async ({ page }) => {
    // CardTitle renders as <div>, so use text locators scoped to main
    const main = page.locator("main");
    await expect(main.getByText("Free", { exact: true })).toBeVisible();
    await expect(main.getByText("One-Time", { exact: true })).toBeVisible();
    await expect(main.getByText("Weekly", { exact: true })).toBeVisible();
    await expect(main.getByText("Monthly", { exact: true }).first()).toBeVisible();
    await expect(main.getByText("Yearly", { exact: true }).first()).toBeVisible();
    await expect(main.getByText("Lifetime", { exact: true })).toBeVisible();
  });

  test("displays correct prices", async ({ page }) => {
    await expect(page.getByText("$0")).toBeVisible();
    await expect(page.getByText("$2.99")).toBeVisible();
    await expect(page.getByText("$4.99")).toBeVisible();
    await expect(page.getByText("$9.99")).toBeVisible();
    await expect(page.getByText("$59.99")).toBeVisible();
    await expect(page.getByText("$99.99")).toBeVisible();
  });

  test("shows Most Popular badge on monthly plan", async ({ page }) => {
    await expect(page.getByText("Most Popular").first()).toBeVisible();
  });

  test("shows Best Value badge on yearly plan", async ({ page }) => {
    await expect(page.getByText("Best Value").first()).toBeVisible();
  });

  test("shows Best Deal badge on lifetime plan", async ({ page }) => {
    await expect(page.getByText("Best Deal")).toBeVisible();
  });

  test("free plan button shows Current Plan", async ({ page }) => {
    await expect(page.getByText("Current Plan")).toBeVisible();
  });

  test("paid plan buttons show Buy Now or Subscribe", async ({ page }) => {
    // One-time, lifetime show "Buy Now"
    const buyNowButtons = page.getByRole("button", { name: "Buy Now" });
    await expect(buyNowButtons.first()).toBeVisible();

    // Weekly, monthly, yearly show "Subscribe"
    const subscribeButtons = page.getByRole("button", { name: "Subscribe" });
    await expect(subscribeButtons.first()).toBeVisible();
  });

  test("clicking a paid plan triggers checkout", async ({ page }) => {
    let checkoutRequested = false;
    await page.route("**/api/checkout", async (route) => {
      checkoutRequested = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "https://example.lemonsqueezy.com/checkout/test",
        }),
      });
    });

    const subscribeBtn = page
      .getByRole("button", { name: "Subscribe" })
      .first();
    await subscribeBtn.click();

    expect(checkoutRequested).toBe(true);
  });

  test("displays feature lists for each tier", async ({ page }) => {
    // Free features
    await expect(page.getByText("2 free analyses")).toBeVisible();

    // Paid features
    await expect(
      page.getByText("Unlimited analyses").first()
    ).toBeVisible();
    await expect(
      page.getByText("Detailed explanations").first()
    ).toBeVisible();
  });
});
