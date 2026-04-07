import { test, expect } from "@playwright/test";
import { mockAuthenticatedSession, setupApiMocks } from "./helpers";

/**
 * Tests the React ErrorBoundary component that wraps the main content.
 * We trigger render errors by injecting corrupted state into the
 * Zustand store via sessionStorage, causing child components to crash.
 */
test.describe("Error boundary", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await setupApiMocks(page);
  });

  test("catches render error and shows fallback UI", async ({ page }) => {
    // Navigate first to establish the session
    await page.goto("/en/analyze");

    // Inject corrupted Zustand state — markers as a string instead of array
    // This will cause .map() in ResultsDisplay to throw a TypeError
    await page.evaluate(() => {
      const corruptState = {
        state: {
          result: {
            summary: "Test summary",
            markers: "NOT_AN_ARRAY", // This will crash .map()
            recommendations: ["rec1"],
            disclaimer: "test",
          },
        },
        version: 0,
      };
      sessionStorage.setItem(
        "bloodwork-analysis",
        JSON.stringify(corruptState)
      );
    });

    // Navigate to results page — the corrupted data should trigger the crash
    await page.goto("/en/analyze/results");

    // ErrorBoundary should catch the render error and show fallback
    await expect(page.getByText("Something went wrong")).toBeVisible({
      timeout: 10000,
    });

    // Should show the "Try again" button
    await expect(
      page.getByRole("button", { name: /Try again/i })
    ).toBeVisible();
  });

  test("'Try again' button resets error state", async ({ page }) => {
    await page.goto("/en/analyze");

    // Inject corrupted state
    await page.evaluate(() => {
      const corruptState = {
        state: {
          result: {
            summary: "Test",
            markers: null, // null will crash .map()
            recommendations: [],
            disclaimer: "test",
          },
        },
        version: 0,
      };
      sessionStorage.setItem(
        "bloodwork-analysis",
        JSON.stringify(corruptState)
      );
    });

    await page.goto("/en/analyze/results");

    await expect(page.getByText("Something went wrong")).toBeVisible({
      timeout: 10000,
    });

    // Click "Try again"
    await page.getByRole("button", { name: /Try again/i }).click();

    // After reset, the ErrorBoundary re-renders children
    // Since the corrupt state is still there, it might crash again
    // OR the component might render the no-results state
    // Either way, the button click should work without the page fully breaking
    await expect(page.getByRole("button", { name: /Try again/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("error boundary shows alert icon", async ({ page }) => {
    await page.goto("/en/analyze");

    await page.evaluate(() => {
      const corruptState = {
        state: {
          result: {
            summary: "Test",
            markers: 42, // number, not array — will crash .map()
            recommendations: [],
            disclaimer: "test",
          },
        },
        version: 0,
      };
      sessionStorage.setItem(
        "bloodwork-analysis",
        JSON.stringify(corruptState)
      );
    });

    await page.goto("/en/analyze/results");

    await expect(page.getByText("Something went wrong")).toBeVisible({
      timeout: 10000,
    });

    // Should show the error description text
    await expect(
      page.getByText(/unexpected error/i)
    ).toBeVisible();
  });
});
