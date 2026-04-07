import { test, expect } from "@playwright/test";
import { setupApiMocks, mockAuthenticatedSession } from "./helpers";

test.describe("Payment pages", () => {
  test.describe("Payment success page", () => {
    test("shows loading state initially", async ({ page }) => {
      await mockAuthenticatedSession(page);
      // Delay the verify endpoint to observe loading state
      await page.route("**/api/checkout/verify", async (route) => {
        await new Promise((r) => setTimeout(r, 2000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ verified: true }),
        });
      });

      await page.goto("/en/payment/success");
      await expect(
        page.getByText("Verifying your payment...")
      ).toBeVisible();
    });

    test("shows success state when payment is verified", async ({ page }) => {
      await mockAuthenticatedSession(page);
      await setupApiMocks(page, { paymentVerified: true });
      await page.goto("/en/payment/success");

      await expect(
        page.getByText("Payment Successful!")
      ).toBeVisible({ timeout: 15000 });

      await expect(
        page.getByText("Thank you for your purchase")
      ).toBeVisible();

      await expect(
        page.getByRole("button", { name: /Start Analyzing/i })
      ).toBeVisible();
    });

    test("shows failed state when payment cannot be verified", async ({
      page,
    }) => {
      await mockAuthenticatedSession(page);
      await setupApiMocks(page, { paymentVerified: false });
      await page.goto("/en/payment/success");

      // Will poll 5 times with 2s delay each, so wait
      await expect(
        page.getByText("Payment Not Verified")
      ).toBeVisible({ timeout: 20000 });

      await expect(
        page.getByText("We couldn't verify your payment")
      ).toBeVisible();

      await expect(
        page.getByRole("button", { name: /Return to Pricing/i })
      ).toBeVisible();
    });
  });

  test.describe("Payment cancel page", () => {
    test("shows cancellation message", async ({ page }) => {
      await page.goto("/en/payment/cancel");

      await expect(
        page.getByText("Payment Cancelled")
      ).toBeVisible();

      await expect(
        page.getByText("Your payment was cancelled. No charges were made.")
      ).toBeVisible();
    });

    test("has return to pricing button", async ({ page }) => {
      await page.goto("/en/payment/cancel");
      await expect(
        page.getByRole("button", { name: /Return to Pricing/i })
      ).toBeVisible();
    });

    test("has try free analysis button", async ({ page }) => {
      await page.goto("/en/payment/cancel");
      await expect(
        page.getByRole("button", { name: /Try Free Analysis/i })
      ).toBeVisible();
    });
  });
});
