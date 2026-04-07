import { describe, it, expect } from "vitest";

/**
 * Tests for the open redirect prevention logic in the OAuth callback.
 * We test the redirect sanitization logic in isolation.
 */

function sanitizeNext(rawNext: string): string {
  return rawNext.startsWith("/") && !rawNext.startsWith("//")
    ? rawNext
    : "/en/analyze";
}

describe("OAuth callback redirect sanitization", () => {
  it("allows a simple relative path", () => {
    expect(sanitizeNext("/en/analyze")).toBe("/en/analyze");
  });

  it("allows a nested relative path", () => {
    expect(sanitizeNext("/he/pricing")).toBe("/he/pricing");
  });

  it("allows path with query string", () => {
    expect(sanitizeNext("/en/analyze?tab=manual")).toBe(
      "/en/analyze?tab=manual"
    );
  });

  it("blocks protocol-relative URL (//evil.com)", () => {
    expect(sanitizeNext("//evil.com")).toBe("/en/analyze");
  });

  it("blocks protocol-relative URL with path (//evil.com/callback)", () => {
    expect(sanitizeNext("//evil.com/callback")).toBe("/en/analyze");
  });

  it("blocks absolute URL (https://evil.com)", () => {
    expect(sanitizeNext("https://evil.com")).toBe("/en/analyze");
  });

  it("blocks javascript: protocol", () => {
    expect(sanitizeNext("javascript:alert(1)")).toBe("/en/analyze");
  });

  it("blocks empty string", () => {
    expect(sanitizeNext("")).toBe("/en/analyze");
  });

  it("blocks relative path without leading slash", () => {
    expect(sanitizeNext("en/analyze")).toBe("/en/analyze");
  });

  it("allows root path", () => {
    expect(sanitizeNext("/")).toBe("/");
  });

  it("blocks data: URL", () => {
    expect(sanitizeNext("data:text/html,<script>alert(1)</script>")).toBe(
      "/en/analyze"
    );
  });

  it("blocks ///evil.com (triple slash)", () => {
    expect(sanitizeNext("///evil.com")).toBe("/en/analyze");
  });

  it("allows path with hash", () => {
    expect(sanitizeNext("/en/analyze#results")).toBe("/en/analyze#results");
  });
});
