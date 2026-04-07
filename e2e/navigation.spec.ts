import { test, expect } from "@playwright/test";

test.describe("Navigation & routing", () => {
  test("landing page loads at /en", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveTitle(/Bloodwork Online/i);
  });

  test("root / redirects to default locale /en", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en/);
  });

  test("pricing page loads", async ({ page }) => {
    await page.goto("/en/pricing");
    await expect(
      page.getByRole("heading", { name: /Simple, Transparent Pricing/i })
    ).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/en/privacy");
    await expect(
      page.getByRole("heading", { name: /Privacy Policy/i })
    ).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/en/terms");
    await expect(
      page.getByRole("heading", { name: /Terms of Service/i })
    ).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/en/login");
    await expect(
      page.getByRole("heading", { name: /Log In/i })
    ).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/en/register");
    await expect(
      page.getByRole("heading", { name: /Create Your Account/i })
    ).toBeVisible();
  });

  test("analyze page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/en/analyze");
    // Should be redirected to login with redirect param
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("invalid locale returns 404", async ({ page }) => {
    const response = await page.goto("/xx/pricing");
    // Next.js returns 404 for unknown locales
    expect(response?.status()).toBe(404);
  });

  test("pricing page is reachable via direct navigation", async ({ page }) => {
    await page.goto("/en/pricing");
    await expect(
      page.getByRole("heading", { name: /Simple, Transparent Pricing/i })
    ).toBeVisible();
  });

  test("footer links navigate correctly", async ({ page }) => {
    await page.goto("/en");
    const footer = page.locator("footer");

    await footer.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL(/\/en\/privacy/);
  });
});
