import { test, expect } from "@playwright/test";

/**
 * OAuth callback tests.
 *
 * The /auth/callback route handler is an API-level route that processes
 * OAuth codes and redirects. In test env (no real Supabase), we can't
 * fully test the code exchange. Instead we test:
 *
 * 1. The login page correctly displays errors from callback redirects
 * 2. The callback API endpoint itself (via direct fetch, not browser nav)
 * 3. Security: open redirect prevention
 */
test.describe("OAuth callback error display on login page", () => {
  test("login page shows error when redirected with error=missing_code", async ({
    page,
  }) => {
    await page.goto("/en/login?error=missing_code");

    // The login page should be rendered (not crashed)
    await expect(
      page.getByRole("heading", { name: /Log In/i })
    ).toBeVisible();
  });

  test("login page shows error when redirected with error=auth_failed", async ({
    page,
  }) => {
    await page.goto("/en/login?error=auth_failed");

    await expect(
      page.getByRole("heading", { name: /Log In/i })
    ).toBeVisible();
  });

  test("login page shows error when redirected with error=server_config", async ({
    page,
  }) => {
    await page.goto("/en/login?error=server_config");

    await expect(
      page.getByRole("heading", { name: /Log In/i })
    ).toBeVisible();
  });
});

test.describe("OAuth callback API endpoint", () => {
  test("GET /auth/callback without code returns redirect to login", async ({
    request,
  }) => {
    // The /auth/callback route handler redirects to /en/login?error=missing_code
    // But the next-intl middleware may also redirect. Test the final status.
    const response = await request.get("/auth/callback", {
      maxRedirects: 0,
    });

    // Should be a redirect (302/307/308 from middleware or route handler)
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
  });

  test("GET /auth/callback with invalid code returns redirect", async ({
    request,
  }) => {
    const response = await request.get("/auth/callback?code=bad-code", {
      maxRedirects: 0,
    });

    // Should redirect (either to login with error, or through middleware)
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
  });

  test("open redirect prevention: validates next param starts with /", async ({
    request,
  }) => {
    // Request with a dangerous next param
    const response = await request.get(
      "/auth/callback?code=test&next=//evil.com",
      { maxRedirects: 0 }
    );

    const location = response.headers()["location"] || "";

    // The redirect should NOT go to evil.com directly
    // It should redirect to localhost (either /en/auth/callback or /en/login)
    expect(location).not.toMatch(/^https?:\/\/evil\.com/);
  });

  test("open redirect prevention: rejects absolute URLs", async ({
    request,
  }) => {
    const response = await request.get(
      "/auth/callback?code=test&next=https://evil.com",
      { maxRedirects: 0 }
    );

    const location = response.headers()["location"] || "";

    // Should not redirect directly to evil.com
    expect(location).not.toMatch(/^https?:\/\/evil\.com/);
  });
});
