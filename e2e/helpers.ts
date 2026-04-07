import type { Page, Route } from "@playwright/test";
import type { AnalysisResult } from "../src/types/blood-test";

/**
 * Mock analysis result returned by /api/analyze
 */
export const MOCK_ANALYSIS_RESULT: AnalysisResult = {
  summary:
    "Your blood test results are mostly within normal ranges. Your hemoglobin and white blood cell counts are healthy. Your cholesterol is slightly elevated.",
  markers: [
    {
      name: "Hemoglobin",
      value: 14.2,
      unit: "g/dL",
      normalRange: "12.0-17.5",
      status: "normal",
      explanation:
        "Your hemoglobin level is within the normal range, indicating healthy oxygen-carrying capacity.",
    },
    {
      name: "White Blood Cells",
      value: 7.5,
      unit: "K/uL",
      normalRange: "4.5-11.0",
      status: "normal",
      explanation:
        "Your white blood cell count is normal, suggesting a healthy immune system.",
    },
    {
      name: "Total Cholesterol",
      value: 215,
      unit: "mg/dL",
      normalRange: "125-200",
      status: "high",
      explanation:
        "Your total cholesterol is slightly above the desirable range. Consider dietary modifications.",
    },
    {
      name: "Glucose",
      value: 65,
      unit: "mg/dL",
      normalRange: "70-100",
      status: "low",
      explanation:
        "Your fasting glucose is slightly below the normal range. This may cause fatigue.",
    },
  ],
  recommendations: [
    "Consider reducing saturated fat intake to help lower cholesterol levels.",
    "Monitor your glucose levels regularly and maintain a balanced diet.",
    "Schedule a follow-up with your healthcare provider in 3-6 months.",
  ],
  disclaimer:
    "These results are AI-generated and should not replace professional medical advice.",
};

/**
 * Mock usage data for different states
 */
export const MOCK_USAGE_FREE = {
  used: 0,
  limit: 2,
  remaining: 2,
  isPaid: false,
  subscriptionStatus: "none",
};

export const MOCK_USAGE_ONE_LEFT = {
  used: 1,
  limit: 2,
  remaining: 1,
  isPaid: false,
  subscriptionStatus: "none",
};

export const MOCK_USAGE_EXHAUSTED = {
  used: 2,
  limit: 2,
  remaining: 0,
  isPaid: false,
  subscriptionStatus: "none",
};

export const MOCK_USAGE_PAID = {
  used: 10,
  limit: 2,
  remaining: -1,
  isPaid: true,
  subscriptionStatus: "active",
};

/**
 * Sets up API route mocks to avoid hitting real Supabase, Gemini, etc.
 * By default, mocks an authenticated free user with 2 analyses remaining.
 */
export async function setupApiMocks(
  page: Page,
  options: {
    usage?: typeof MOCK_USAGE_FREE;
    analysisResult?: AnalysisResult;
    analysisError?: { status: number; body: Record<string, unknown> };
    checkoutUrl?: string;
    offerActive?: boolean;
    paymentVerified?: boolean;
  } = {}
) {
  const {
    usage = MOCK_USAGE_FREE,
    analysisResult = MOCK_ANALYSIS_RESULT,
    analysisError,
    checkoutUrl = "https://example.lemonsqueezy.com/checkout/test",
    offerActive = false,
    paymentVerified = false,
  } = options;

  // Mock /api/usage
  await page.route("**/api/usage", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(usage),
    });
  });

  // Mock /api/analyze
  await page.route("**/api/analyze", async (route: Route) => {
    if (analysisError) {
      await route.fulfill({
        status: analysisError.status,
        contentType: "application/json",
        body: JSON.stringify(analysisError.body),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(analysisResult),
      });
    }
  });

  // Mock /api/checkout
  await page.route("**/api/checkout", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: checkoutUrl }),
    });
  });

  // Mock /api/offer
  await page.route("**/api/offer", async (route: Route) => {
    if (offerActive) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          active: true,
          expiresAt: Date.now() + 12 * 60 * 60 * 1000,
          remainingMs: 12 * 60 * 60 * 1000,
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ active: false }),
      });
    }
  });

  // Mock /api/checkout/verify
  await page.route("**/api/checkout/verify", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ verified: paymentVerified }),
    });
  });

  // Mock /api/health
  await page.route("**/api/health", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "healthy",
        checks: {
          app: "ok",
          redis: "ok",
          gemini: "ok",
          lemonsqueezy: "ok",
        },
      }),
    });
  });
}

/**
 * Sets up a mock authenticated session for E2E tests.
 * Uses a special bypass cookie recognized by the proxy when
 * NEXT_PUBLIC_SUPABASE_URL points to localhost.
 */
export async function mockAuthenticatedSession(page: Page) {
  await page.context().addCookies([
    {
      name: "e2e_auth_bypass",
      value: "true",
      domain: "localhost",
      path: "/",
    },
  ]);
}

/**
 * Populates the Zustand analysis store via sessionStorage to simulate
 * having results available on the results page.
 */
export async function injectAnalysisResult(
  page: Page,
  result: AnalysisResult = MOCK_ANALYSIS_RESULT
) {
  await page.evaluate((res) => {
    const state = {
      state: { result: res },
      version: 0,
    };
    sessionStorage.setItem("bloodwork-analysis", JSON.stringify(state));
  }, result);
}

/**
 * Creates a small valid PNG file as a Buffer for upload testing.
 */
export function createTestPngBuffer(): Buffer {
  // Minimal 1x1 red PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8" +
      "z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
}

/**
 * Creates a minimal PDF buffer for upload testing.
 */
export function createTestPdfBuffer(): Buffer {
  const pdfContent =
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n" +
    "xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n" +
    "0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n206\n%%EOF";
  return Buffer.from(pdfContent);
}

export const LOCALES = ["en", "he", "ru", "es", "de", "fr"] as const;
