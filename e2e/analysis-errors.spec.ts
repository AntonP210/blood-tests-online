import { test, expect } from "@playwright/test";
import { mockAuthenticatedSession, setupApiMocks, MOCK_USAGE_FREE } from "./helpers";

/**
 * Helper: fill the analyze form with valid data
 */
async function fillAnalyzeForm(page: import("@playwright/test").Page) {
  await page.getByRole("spinbutton", { name: "Age" }).fill("30");
  await page.locator("#gender").click();
  await page.getByRole("option", { name: "Male", exact: true }).click();
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(8000, "a"),
  });
}

test.describe("Analysis error handling", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("422 no markers found: shows specific error message", async ({
    page,
  }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "No blood test markers found in the uploaded file. Please upload a clear image of your blood test results.",
        }),
      });
    });

    await page.goto("/en/analyze");
    await fillAnalyzeForm(page);
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    await expect(
      page.getByText(/No blood test markers found/)
    ).toBeVisible({ timeout: 5000 });

    // Should NOT trigger upgrade modal
    await expect(
      page.getByText("You've used all your free analyses")
    ).not.toBeVisible();
  });

  test("422 empty response: shows helpful error", async ({ page }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "Could not read your blood test. Please upload a clearer image or try manual entry.",
        }),
      });
    });

    await page.goto("/en/analyze");
    await fillAnalyzeForm(page);
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    await expect(
      page.getByText(/Could not read your blood test/)
    ).toBeVisible({ timeout: 5000 });
  });

  test("500 server error: shows generic error message", async ({ page }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Analysis failed: Error — Something went wrong",
        }),
      });
    });

    await page.goto("/en/analyze");
    await fillAnalyzeForm(page);
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    await expect(
      page.getByText(/Analysis failed/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("network error: shows generic error message", async ({ page }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/analyze", async (route) => {
      await route.abort("connectionrefused");
    });

    await page.goto("/en/analyze");
    await fillAnalyzeForm(page);
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    // Should show some error (the catch block in analysis-form.tsx)
    await expect(
      page.locator('[data-slot="alert"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test("400 validation error: shows error details", async ({ page }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "File is too small to contain blood test results. Please upload a clear image or PDF.",
        }),
      });
    });

    await page.goto("/en/analyze");
    await fillAnalyzeForm(page);
    await page.getByRole("button", { name: /Analyze My Results/i }).click();

    await expect(
      page.getByText(/File is too small/)
    ).toBeVisible({ timeout: 5000 });
  });

  test("error alert disappears when user submits again successfully", async ({
    page,
  }) => {
    await setupApiMocks(page, { usage: MOCK_USAGE_FREE });

    // First attempt: error
    let callCount = 0;
    await page.route("**/api/analyze", async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Temporary failure" }),
        });
      } else {
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
                explanation: "Normal.",
              },
            ],
            recommendations: ["Stay healthy."],
            disclaimer: "AI-generated.",
          }),
        });
      }
    });

    await page.goto("/en/analyze");
    await fillAnalyzeForm(page);

    // First submit — error
    await page.getByRole("button", { name: /Analyze My Results/i }).click();
    await expect(page.getByText("Temporary failure")).toBeVisible({
      timeout: 5000,
    });

    // Second submit — success
    await page.getByRole("button", { name: /Analyze My Results/i }).click();
    await page.waitForURL("**/analyze/results", { timeout: 10000 });

    // Error should be gone, results should show
    await expect(page.getByText("Temporary failure")).not.toBeVisible();
  });
});
