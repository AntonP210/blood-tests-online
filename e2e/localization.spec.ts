import { test, expect } from "@playwright/test";

test.describe("Localization", () => {
  test("English landing page loads with correct text", async ({ page }) => {
    await page.goto("/en");
    await expect(
      page.getByRole("heading", { name: /Your Bloodwork, Clearly Explained/i })
    ).toBeVisible();
  });

  test("Hebrew locale loads with RTL direction", async ({ page }) => {
    await page.goto("/he");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "he");
  });

  test("Russian locale loads", async ({ page }) => {
    await page.goto("/ru");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ru");
  });

  test("Spanish locale loads", async ({ page }) => {
    await page.goto("/es");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "es");
  });

  test("German locale loads", async ({ page }) => {
    await page.goto("/de");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "de");
  });

  test("French locale loads", async ({ page }) => {
    await page.goto("/fr");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "fr");
  });

  test("language switcher is visible and contains all locales", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/en");

    if (isMobile) {
      // Open the hamburger menu to access the switcher
      const menuBtn = page.getByRole("button", { name: /Open menu/i });
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();
    }

    // Get the visible switcher (desktop has one, mobile menu has another)
    const switcher = page
      .locator('select[aria-label="Select language"]')
      .locator("visible=true");
    await expect(switcher).toBeVisible({ timeout: 5000 });

    const options = switcher.locator("option");
    await expect(options).toHaveCount(6);
  });

  test("language switcher changes locale", async ({ page, isMobile }) => {
    await page.goto("/en");

    if (isMobile) {
      const menuBtn = page.getByRole("button", { name: /Open menu/i });
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();
    }

    const switcher = page
      .locator('select[aria-label="Select language"]')
      .locator("visible=true");
    await expect(switcher).toBeVisible({ timeout: 5000 });
    await switcher.selectOption("he");
    await expect(page).toHaveURL(/\/he/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("non-Hebrew locales use LTR direction", async ({ page }) => {
    const ltrLocales = ["en", "ru", "es", "de", "fr"];
    for (const locale of ltrLocales) {
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    }
  });

  test("pricing page loads in each locale", async ({ page }) => {
    const locales = ["en", "he", "ru", "es", "de", "fr"];
    for (const locale of locales) {
      const response = await page.goto(`/${locale}/pricing`);
      expect(response?.status()).toBe(200);
    }
  });

  test("login page loads in each locale", async ({ page }) => {
    const locales = ["en", "he", "ru", "es", "de", "fr"];
    for (const locale of locales) {
      const response = await page.goto(`/${locale}/login`);
      expect(response?.status()).toBe(200);
    }
  });
});
