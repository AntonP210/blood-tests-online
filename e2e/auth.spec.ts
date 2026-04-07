import { test, expect } from "@playwright/test";

test.describe("Authentication pages", () => {
  test.describe("Login page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/en/login");
    });

    test("renders login form with email and password fields", async ({
      page,
    }) => {
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Log In" })
      ).toBeVisible();
    });

    test("renders Google login button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /Continue with Google/i })
      ).toBeVisible();
    });

    test("has link to register page", async ({ page }) => {
      // The "Sign Up" link in "Don't have an account? Sign Up"
      await expect(
        page.getByRole("link", { name: "Sign Up" })
      ).toBeVisible();
    });

    test("login button triggers form validation for empty fields", async ({
      page,
    }) => {
      // HTML5 validation should prevent submission of empty required fields
      await page.getByRole("button", { name: "Log In" }).click();
      // The form should not navigate away
      await expect(page).toHaveURL(/\/en\/login/);
    });

    test("preserves redirect param from URL", async ({ page }) => {
      await page.goto("/en/login?redirect=/en/analyze");
      await expect(page).toHaveURL(/redirect/);
    });
  });

  test.describe("Register page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/en/register");
    });

    test("renders registration form with all fields", async ({ page }) => {
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Confirm Password")).toBeVisible();
      // The submit button says "Sign Up"
      const signUpButtons = page.getByRole("button", { name: "Sign Up" });
      await expect(signUpButtons.first()).toBeVisible();
    });

    test("renders Google signup button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /Continue with Google/i })
      ).toBeVisible();
    });

    test("has link to login page", async ({ page }) => {
      // There may be a "Log In" link in both header and form; target the one in main
      const main = page.locator("main");
      await expect(
        main.getByRole("link", { name: "Log In" })
      ).toBeVisible();
    });
  });

  test.describe("Protected routes", () => {
    test("unauthenticated user is redirected to login from /analyze", async ({
      page,
    }) => {
      await page.goto("/en/analyze");
      await expect(page).toHaveURL(/\/en\/login/);
    });

    test("redirect param includes original path", async ({ page }) => {
      await page.goto("/en/analyze/results");
      await expect(page).toHaveURL(/\/en\/login.*redirect/);
    });
  });
});
