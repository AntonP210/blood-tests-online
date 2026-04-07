import { test, expect } from "@playwright/test";

test.describe("API health endpoint", () => {
  test("GET /api/health returns status", async ({ request }) => {
    const response = await request.get("/api/health");
    // Even if services are unavailable, the endpoint should respond
    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("checks");
    expect(body.checks).toHaveProperty("app", "ok");
  });
});
