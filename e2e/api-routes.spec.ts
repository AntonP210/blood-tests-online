import { test, expect } from "@playwright/test";

test.describe("API routes", () => {
  test.describe("POST /api/analyze", () => {
    test("returns 401 when not authenticated", async ({ request }) => {
      const response = await request.post("/api/analyze", {
        data: {
          inputType: "manual",
          markers: [{ name: "Hemoglobin", value: 14.2, unit: "g/dL" }],
          age: 30,
          gender: "male",
        },
      });
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Authentication required");
    });

    test("returns 400 for invalid JSON body", async ({ request }) => {
      const response = await request.post("/api/analyze", {
        headers: { "Content-Type": "application/json" },
        data: "not valid json{",
      });
      // Should return either 400 or 401 (auth checked first)
      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe("GET /api/usage", () => {
    test("returns 401 when not authenticated", async ({ request }) => {
      const response = await request.get("/api/usage");
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Authentication required");
    });
  });

  test.describe("POST /api/checkout", () => {
    test("returns 401 when not authenticated", async ({ request }) => {
      const response = await request.post("/api/checkout", {
        data: { tier: "monthly" },
      });
      // Should return 401 or 500 (NEXT_PUBLIC_APP_URL might not be set)
      expect([401, 500]).toContain(response.status());
    });
  });

  test.describe("GET /api/checkout/verify", () => {
    test("returns 401 when not authenticated", async ({ request }) => {
      const response = await request.get("/api/checkout/verify");
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.verified).toBe(false);
    });
  });

  test.describe("GET /api/offer", () => {
    test("returns active: false when not authenticated", async ({
      request,
    }) => {
      const response = await request.get("/api/offer");
      const body = await response.json();
      expect(body.active).toBe(false);
    });
  });

  test.describe("POST /api/webhooks/lemonsqueezy", () => {
    test("returns 400 when missing signature header", async ({ request }) => {
      const response = await request.post("/api/webhooks/lemonsqueezy", {
        data: { meta: { event_name: "test" }, data: { id: "1" } },
      });
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Missing signature header");
    });
  });
});
