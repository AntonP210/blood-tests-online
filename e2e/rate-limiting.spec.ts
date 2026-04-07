import { test, expect } from "@playwright/test";
import { mockAuthenticatedSession, setupApiMocks, MOCK_USAGE_FREE } from "./helpers";

/**
 * Tests that the UI correctly handles rate-limiting (429) and abuse detection
 * responses from the analyze API.
 */
test.describe("Rate limiting and abuse detection", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("429 rate limit: shows error message on analyze form", async ({
    page,
  }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    // Override analyze to return 429
    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Too many requests. Please try again later.",
        }),
      });
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

    // Should show error alert (not upgrade modal)
    await expect(
      page.getByText("Too many requests. Please try again later.")
    ).toBeVisible({ timeout: 5000 });

    // Upgrade modal should NOT appear (that's only for 402)
    await expect(
      page.getByText("You've used all your free analyses")
    ).not.toBeVisible();
  });

  test("429 abuse detection: shows abuse-specific error message", async ({
    page,
  }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "Too many failed attempts. Please try again in 15 minutes.",
        }),
      });
    });

    await page.goto("/en/analyze");

    await page.getByRole("spinbutton", { name: "Age" }).fill("25");
    await page.locator("#gender").click();
    await page.getByRole("option", { name: "Female", exact: true }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(8000, "a"),
    });
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    await expect(
      page.getByText("Too many failed attempts. Please try again in 15 minutes.")
    ).toBeVisible({ timeout: 5000 });
  });

  test("503 Gemini busy: shows service busy error", async ({ page }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Service is busy. Please try again in a few minutes.",
        }),
      });
    });

    await page.goto("/en/analyze");

    await page.getByRole("spinbutton", { name: "Age" }).fill("40");
    await page.locator("#gender").click();
    await page.getByRole("option", { name: "Male", exact: true }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(8000, "a"),
    });
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    await expect(
      page.getByText("Service is busy. Please try again in a few minutes.")
    ).toBeVisible({ timeout: 5000 });
  });

  test("504 timeout: shows timeout error", async ({ page }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 504,
        contentType: "application/json",
        body: JSON.stringify({
          error: "The analysis took too long. Please try again.",
        }),
      });
    });

    await page.goto("/en/analyze");

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

    await expect(
      page.getByText("The analysis took too long. Please try again.")
    ).toBeVisible({ timeout: 5000 });
  });

  test("form recovers after error — submit button re-enabled", async ({
    page,
  }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Too many requests. Please try again later.",
        }),
      });
    });

    await page.goto("/en/analyze");

    await page.getByRole("spinbutton", { name: "Age" }).fill("30");
    await page.locator("#gender").click();
    await page.getByRole("option", { name: "Male", exact: true }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(8000, "a"),
    });

    const submitBtn = page.getByRole("button", { name: /Analyze My Results/i });
    await submitBtn.click();

    // Error shown
    await expect(
      page.getByText("Too many requests. Please try again later.")
    ).toBeVisible({ timeout: 5000 });

    // Submit button should be re-enabled (not stuck in loading)
    await expect(submitBtn).toBeEnabled();
  });
});
