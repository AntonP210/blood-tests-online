import { test, expect } from "@playwright/test";
import { setupApiMocks, mockAuthenticatedSession } from "./helpers";

/**
 * Creates a fake JWT token that the Supabase client will accept
 * without making a network request to validate it.
 */
function createFakeJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "e2e-test-user-id",
      email: "test@example.com",
      role: "authenticated",
      aud: "authenticated",
      iss: "supabase-demo",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    })
  ).toString("base64url");
  const sig = Buffer.from("fake-signature-for-testing").toString("base64url");
  return `${header}.${payload}.${sig}`;
}

/**
 * Sets up the browser so the Header component sees an authenticated user.
 */
async function setupAuthenticatedUI(page: import("@playwright/test").Page) {
  const fakeJwt = createFakeJwt();

  // Mock Supabase /auth/v1/user endpoint
  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "e2e-test-user-id",
        email: "test@example.com",
        role: "authenticated",
        aud: "authenticated",
        app_metadata: {},
        user_metadata: {},
        created_at: "2026-01-01T00:00:00Z",
      }),
    });
  });

  // Mock token refresh
  await page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: fakeJwt,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "fake-refresh-token",
        user: {
          id: "e2e-test-user-id",
          email: "test@example.com",
          role: "authenticated",
          aud: "authenticated",
        },
      }),
    });
  });

  // Mock signOut — return success immediately
  await page.route("**/auth/v1/logout", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });

  // Set Supabase auth session cookie with proper JWT
  // Supabase SSR uses cookie name: sb-{host}-auth-token
  await page.context().addCookies([
    {
      name: "sb-localhost-auth-token",
      value: JSON.stringify({
        access_token: fakeJwt,
        refresh_token: "fake-refresh-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: "bearer",
        user: {
          id: "e2e-test-user-id",
          email: "test@example.com",
          role: "authenticated",
        },
      }),
      domain: "localhost",
      path: "/",
    },
  ]);
}

test.describe("Logout flow (desktop)", () => {
  // Desktop nav is hidden on mobile viewports — skip for mobile project
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await setupApiMocks(page);
    await setupAuthenticatedUI(page);
  });

  test("logout button visible when authenticated", async ({ page }) => {
    await page.goto("/en/analyze");
    await expect(page.getByText("Log Out").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("clicking logout redirects to home page", async ({ page }) => {
    await page.goto("/en/analyze");
    await expect(page.getByText("Log Out").first()).toBeVisible({
      timeout: 10000,
    });

    // Listen for navigation before clicking
    const [response] = await Promise.all([
      page.waitForNavigation({ timeout: 10000 }),
      page.getByText("Log Out").first().click(),
    ]);

    // After logout, page should navigate away from /analyze
    expect(page.url()).not.toContain("/analyze");
  });

  test("authenticated user sees Analyze button in nav", async ({ page }) => {
    await page.goto("/en/pricing");

    // The Analyze button is rendered as <Button render={<Link>}> which
    // creates a button wrapping a link. Match either role.
    await expect(
      page.getByRole("button", { name: "Analyze" }).or(
        page.getByRole("link", { name: "Analyze" })
      ).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated user sees Login/Register, not Logout", async ({
    page,
  }) => {
    // Fresh context without auth mocking
    const freshContext = await page.context().browser()!.newContext();
    const freshPage = await freshContext.newPage();
    await freshPage.goto("/en/pricing");

    await expect(freshPage.getByText("Log In")).toBeVisible();
    await expect(freshPage.getByText("Sign Up")).toBeVisible();
    await expect(freshPage.getByText("Log Out")).not.toBeVisible();
    await freshContext.close();
  });
});

test.describe("Logout flow (mobile)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await setupApiMocks(page);
    await setupAuthenticatedUI(page);
  });

  test("logout available in hamburger menu", async ({ page }) => {
    await page.goto("/en/analyze");

    await page.getByLabel("Open menu").click();
    await expect(page.getByText("Log Out").last()).toBeVisible({ timeout: 10000 });
  });

  test("clicking logout in mobile menu redirects to home", async ({
    page,
  }) => {
    await page.goto("/en/analyze");

    await page.getByLabel("Open menu").click();
    await expect(page.getByText("Log Out").last()).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }),
      page.getByText("Log Out").last().click(),
    ]);

    expect(page.url()).not.toContain("/analyze");
  });
});
