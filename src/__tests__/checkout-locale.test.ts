import { describe, it, expect } from "vitest";

/**
 * Tests for locale validation in the checkout route.
 * Extracted logic to test in isolation.
 */

const validLocales = ["en", "he", "ru", "es", "de", "fr"];

function sanitizeLocale(locale: unknown): string {
  return typeof locale === "string" && validLocales.includes(locale)
    ? locale
    : "en";
}

describe("checkout locale validation", () => {
  it("accepts valid locales", () => {
    for (const locale of validLocales) {
      expect(sanitizeLocale(locale)).toBe(locale);
    }
  });

  it("defaults to 'en' for invalid locale", () => {
    expect(sanitizeLocale("zh")).toBe("en");
  });

  it("defaults to 'en' for empty string", () => {
    expect(sanitizeLocale("")).toBe("en");
  });

  it("defaults to 'en' for undefined", () => {
    expect(sanitizeLocale(undefined)).toBe("en");
  });

  it("defaults to 'en' for null", () => {
    expect(sanitizeLocale(null)).toBe("en");
  });

  it("rejects XSS attempt in locale", () => {
    expect(sanitizeLocale("<script>alert(1)</script>")).toBe("en");
  });

  it("rejects path traversal in locale", () => {
    expect(sanitizeLocale("../../../etc/passwd")).toBe("en");
  });
});
