import { test, expect } from "@playwright/test";

test.describe("Responsive design", () => {
  test.describe("Mobile viewport", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("header shows hamburger menu on mobile", async ({ page }) => {
      await page.goto("/en");
      // Hamburger button should be visible
      await expect(
        page.getByRole("button", { name: /Open menu/i })
      ).toBeVisible();
    });

    test("mobile menu opens and shows navigation", async ({ page }) => {
      await page.goto("/en");
      await page.getByRole("button", { name: /Open menu/i }).click();
      // Mobile nav links should appear in the dropdown
      // The mobile menu is a div below the header with nav links
      await expect(
        page.locator("header").getByText("Pricing").last()
      ).toBeVisible();
    });

    test("mobile menu can be closed", async ({ page }) => {
      await page.goto("/en");
      await page.getByRole("button", { name: /Open menu/i }).click();
      await expect(
        page.getByRole("button", { name: /Close menu/i })
      ).toBeVisible();
      await page.getByRole("button", { name: /Close menu/i }).click();
      // Menu should be closed
      await expect(
        page.getByRole("button", { name: /Open menu/i })
      ).toBeVisible();
    });

    test("landing page hero is readable on mobile", async ({ page }) => {
      await page.goto("/en");
      await expect(
        page.getByRole("heading", {
          name: /Your Bloodwork, Clearly Explained/i,
        })
      ).toBeVisible();
    });

    test("pricing cards are visible on mobile", async ({ page }) => {
      await page.goto("/en/pricing");
      const main = page.locator("main");
      await expect(main.getByText("Free", { exact: true })).toBeVisible();
      await expect(main.getByText("Monthly", { exact: true }).first()).toBeVisible();
    });

    test("login form fits mobile viewport", async ({ page }) => {
      await page.goto("/en/login");
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      // Form should not overflow
      const emailInput = page.getByLabel("Email");
      const box = await emailInput.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(375);
      }
    });
  });

  test.describe("Desktop viewport", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("header shows full navigation on desktop", async ({ page }) => {
      await page.goto("/en");
      // Desktop nav should be visible
      await expect(page.locator("header").getByText("Pricing")).toBeVisible();
      // Hamburger should not be visible
      await expect(
        page.getByRole("button", { name: /Open menu/i })
      ).not.toBeVisible();
    });

    test("landing page layout is correct on desktop", async ({ page }) => {
      await page.goto("/en");
      await expect(
        page.getByRole("heading", {
          name: /Your Bloodwork, Clearly Explained/i,
        })
      ).toBeVisible();
    });

    test("pricing cards display on desktop", async ({ page }) => {
      await page.goto("/en/pricing");
      const main = page.locator("main");
      await expect(main.getByText("Free", { exact: true })).toBeVisible();
      await expect(main.getByText("Lifetime", { exact: true })).toBeVisible();
    });
  });
});
