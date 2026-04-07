import { test, expect } from "@playwright/test";

test.describe("Privacy Policy page", () => {
  test("renders with title and key sections", async ({ page }) => {
    await page.goto("/en/privacy");

    const main = page.locator("main");

    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();

    // Key section headings
    await expect(main.getByText("Overview")).toBeVisible();
    await expect(main.getByText("Data We Collect")).toBeVisible();
    await expect(main.getByText("Data We Do Not Collect")).toBeVisible();
    await expect(main.getByText("How Your Data Is Processed")).toBeVisible();
    await expect(main.getByText("Authentication & Cookies")).toBeVisible();
    await expect(main.getByText("Payment Information")).toBeVisible();
    await expect(main.getByText("Third-Party Services")).toBeVisible();
    await expect(main.getByText("Contact").first()).toBeVisible();
  });

  test("states that blood test data is not stored", async ({ page }) => {
    await page.goto("/en/privacy");

    await expect(
      page.getByText("We do not store your blood test results")
    ).toBeVisible();
    await expect(
      page.getByText("We do not store uploaded images or PDFs")
    ).toBeVisible();
  });

  test("mentions third-party services", async ({ page }) => {
    await page.goto("/en/privacy");

    const main = page.locator("main");
    await expect(main.getByText("Google Gemini AI")).toBeVisible();
    await expect(main.getByText("LemonSqueezy").first()).toBeVisible();
    await expect(main.getByText("Vercel")).toBeVisible();
  });

  test("shows last updated date", async ({ page }) => {
    await page.goto("/en/privacy");

    await expect(page.getByText("Last updated: April 2026")).toBeVisible();
  });
});

test.describe("Terms of Service page", () => {
  test("renders with title and key sections", async ({ page }) => {
    await page.goto("/en/terms");

    await expect(
      page.getByRole("heading", { name: "Terms of Service" })
    ).toBeVisible();

    // Key section headings
    await expect(page.getByText("Acceptance of Terms")).toBeVisible();
    await expect(page.getByText("Medical Disclaimer")).toBeVisible();
    await expect(page.getByText("Service Description")).toBeVisible();
    await expect(page.getByText("Payments and Refunds")).toBeVisible();
    await expect(page.getByText("Limitation of Liability")).toBeVisible();
    await expect(page.getByText("Acceptable Use")).toBeVisible();
    await expect(page.getByText("Changes").first()).toBeVisible();
  });

  test("contains medical disclaimer warning", async ({ page }) => {
    await page.goto("/en/terms");

    await expect(
      page.getByText(/NOT a medical service/i)
    ).toBeVisible();
    await expect(
      page.getByText("Always consult a qualified healthcare provider")
    ).toBeVisible();
  });

  test("lists acceptable use restrictions", async ({ page }) => {
    await page.goto("/en/terms");

    await expect(
      page.getByText("personal blood test interpretation")
    ).toBeVisible();
    await expect(
      page.getByText("Attempt to bypass rate limits")
    ).toBeVisible();
    await expect(
      page.getByText("automated tools to access the service")
    ).toBeVisible();
  });

  test("shows last updated date", async ({ page }) => {
    await page.goto("/en/terms");

    await expect(page.getByText("Last updated: April 2026")).toBeVisible();
  });
});

test.describe("Legal page navigation from footer", () => {
  test("footer Privacy link navigates to privacy page", async ({ page }) => {
    await page.goto("/en");

    // Use getByRole('link') within footer to avoid matching page text
    const privacyLink = page.locator("footer").getByRole("link", { name: "Privacy" });
    await expect(privacyLink.first()).toBeVisible();
    await privacyLink.first().click();

    await page.waitForURL("**/privacy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" })
    ).toBeVisible();
  });

  test("footer Terms link navigates to terms page", async ({ page }) => {
    await page.goto("/en");

    const termsLink = page.locator("footer").getByRole("link", { name: "Terms" });
    await expect(termsLink.first()).toBeVisible();
    await termsLink.first().click();

    await page.waitForURL("**/terms");
    await expect(
      page.getByRole("heading", { name: "Terms of Service" })
    ).toBeVisible();
  });
});
