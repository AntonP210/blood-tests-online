import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("renders all major sections", async ({ page }) => {
    // Trust bar
    await expect(
      page.getByText("We never store your health data")
    ).toBeVisible();

    // Hero section
    await expect(
      page.getByRole("heading", { name: /Your Bloodwork, Clearly Explained/i })
    ).toBeVisible();

    // Privacy badges in hero (use exact: true to avoid matching sub-sections)
    const heroSection = page.locator("section").first();
    await expect(heroSection.getByText("No account", { exact: true })).toBeVisible();
    await expect(heroSection.getByText("No data stored")).toBeVisible();
    await expect(heroSection.getByText("Encrypted & discarded")).toBeVisible();

    // CTA buttons (rendered as <button> via render prop, not <a>)
    await expect(
      page.getByRole("button", { name: /Get Started/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /View Pricing/i }).first()
    ).toBeVisible();

    // How it works
    await expect(
      page.getByRole("heading", { name: /Three Steps/i })
    ).toBeVisible();

    // Privacy section
    await expect(
      page.getByRole("heading", {
        name: /We Don't Store Your Data/i,
      })
    ).toBeVisible();

    // FAQ section
    await expect(
      page.getByRole("heading", { name: /Questions\? We've Got Answers/i })
    ).toBeVisible();
  });

  test("hero CTA buttons are present", async ({ page }) => {
    // The Button component with render={<Link>} creates a button, not a link
    await expect(
      page.getByRole("button", { name: /Get Started/i })
    ).toBeVisible();
  });

  test("pricing section is visible with plans", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Simple, Transparent Pricing/i })
    ).toBeVisible();
    // Free and Monthly plans shown in landing preview
    await expect(page.getByText("$0")).toBeVisible();
  });

  test("medical disclaimer is visible in header area", async ({ page }) => {
    // The disclaimer text appears in the top banner and in the footer
    const disclaimerBanner = page.locator(".border-amber-200").first();
    await expect(disclaimerBanner).toBeVisible();
    await expect(
      disclaimerBanner.getByText(/informational purposes only/i)
    ).toBeVisible();
  });

  test("footer contains privacy and terms links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByText("Privacy Policy")).toBeVisible();
    await expect(footer.getByText("Terms of Service")).toBeVisible();
  });

  test("header shows app name", async ({ page }) => {
    const header = page.locator("header");
    await expect(header.getByText("Bloodwork Online")).toBeVisible();
  });
});
