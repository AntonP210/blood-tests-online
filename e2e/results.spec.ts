import { test, expect } from "@playwright/test";
import {
  setupApiMocks,
  mockAuthenticatedSession,
  injectAnalysisResult,
  MOCK_ANALYSIS_RESULT,
} from "./helpers";

test.describe("Results page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await setupApiMocks(page);
  });

  test("shows no-results message when navigated to directly without data", async ({
    page,
  }) => {
    await page.goto("/en/analyze/results");
    await expect(
      page.getByText(/No results to display/i)
    ).toBeVisible();
  });

  test("displays analysis results when data is present", async ({ page }) => {
    await page.goto("/en/analyze");
    await injectAnalysisResult(page);
    await page.goto("/en/analyze/results");

    // Title
    await expect(
      page.getByRole("heading", { name: /Your Blood Test Analysis/i })
    ).toBeVisible();

    // Summary
    await expect(page.getByText("Summary")).toBeVisible();
    await expect(
      page.getByText(/mostly within normal ranges/i)
    ).toBeVisible();

    // Markers section
    await expect(
      page.getByText("Detailed Marker Analysis")
    ).toBeVisible();

    // Individual marker titles (use exact match since names appear in explanations too)
    const markerTitles = page.locator('[data-slot="card-title"]');
    await expect(markerTitles.filter({ hasText: "Hemoglobin" })).toBeVisible();
    await expect(markerTitles.filter({ hasText: "White Blood Cells" })).toBeVisible();
    await expect(markerTitles.filter({ hasText: "Total Cholesterol" })).toBeVisible();
    await expect(markerTitles.filter({ hasText: "Glucose" })).toBeVisible();
  });

  test("displays correct status badges for markers", async ({ page }) => {
    await page.goto("/en/analyze");
    await injectAnalysisResult(page);
    await page.goto("/en/analyze/results");

    // Normal markers (there are 2 with "Normal" status)
    const normalBadges = page.getByText("Normal", { exact: true });
    await expect(normalBadges.first()).toBeVisible();

    // High marker
    await expect(page.getByText("High", { exact: true })).toBeVisible();

    // Low marker
    await expect(page.getByText("Low", { exact: true })).toBeVisible();
  });

  test("displays marker values and ranges", async ({ page }) => {
    await page.goto("/en/analyze");
    await injectAnalysisResult(page);
    await page.goto("/en/analyze/results");

    // Hemoglobin value
    await expect(page.getByText("14.2 g/dL").first()).toBeVisible();
    // Hemoglobin normal range
    await expect(page.getByText("12.0-17.5 g/dL")).toBeVisible();
  });

  test("displays recommendations", async ({ page }) => {
    await page.goto("/en/analyze");
    await injectAnalysisResult(page);
    await page.goto("/en/analyze/results");

    await expect(page.getByText("Recommendations")).toBeVisible();
    await expect(
      page.getByText(/reducing saturated fat intake/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Monitor your glucose levels/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Schedule a follow-up/i)
    ).toBeVisible();
  });

  test("displays medical disclaimer on results", async ({ page }) => {
    await page.goto("/en/analyze");
    await injectAnalysisResult(page);
    await page.goto("/en/analyze/results");

    await expect(
      page.getByText(/AI-generated.*should not replace/i)
    ).toBeVisible();
  });

  test("has print button", async ({ page }) => {
    await page.goto("/en/analyze");
    await injectAnalysisResult(page);
    await page.goto("/en/analyze/results");

    await expect(
      page.getByRole("button", { name: /Print Results/i })
    ).toBeVisible();
  });

  test("has new analysis button back to analyze page", async ({ page }) => {
    await page.goto("/en/analyze");
    await injectAnalysisResult(page);
    await page.goto("/en/analyze/results");

    await expect(
      page.getByRole("button", { name: /New Analysis/i })
    ).toBeVisible();
  });

  test("handles empty recommendations gracefully", async ({ page }) => {
    const resultNoRecs = {
      ...MOCK_ANALYSIS_RESULT,
      recommendations: [],
    };
    await page.goto("/en/analyze");
    await injectAnalysisResult(page, resultNoRecs);
    await page.goto("/en/analyze/results");

    // Should still show marker titles
    const markerTitles = page.locator('[data-slot="card-title"]');
    await expect(
      markerTitles.filter({ hasText: "Hemoglobin" })
    ).toBeVisible();
    // Recommendations heading should not appear
    await expect(page.getByText("Recommendations")).not.toBeVisible();
  });
});
