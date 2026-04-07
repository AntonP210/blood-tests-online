import { describe, it, expect } from "vitest";
import { buildManualPrompt, buildFilePrompt } from "@/lib/gemini-prompt";

describe("buildManualPrompt", () => {
  it("builds a prompt with sanitized markers", () => {
    const prompt = buildManualPrompt(
      [{ name: "Hemoglobin", value: 14.5, unit: "g/dL" }],
      30,
      "male"
    );
    expect(prompt).toContain("30-year-old male");
    expect(prompt).toContain("Hemoglobin: 14.5 g/dL");
    expect(prompt).toContain("JSON");
  });

  it("sanitizes control characters in marker names", () => {
    const prompt = buildManualPrompt(
      [{ name: "WBC\x00\x1ftest", value: 5, unit: "K/uL" }],
      25,
      "female"
    );
    expect(prompt).toContain("WBCtest");
    expect(prompt).not.toContain("\x00");
  });

  it("clamps age to valid range", () => {
    const prompt = buildManualPrompt(
      [{ name: "WBC", value: 5, unit: "K/uL" }],
      -5,
      "male"
    );
    expect(prompt).toContain("1-year-old");
  });

  it("clamps high age to valid range", () => {
    const prompt = buildManualPrompt(
      [{ name: "WBC", value: 5, unit: "K/uL" }],
      999,
      "male"
    );
    expect(prompt).toContain("120-year-old");
  });

  it("sanitizes invalid gender to 'other'", () => {
    const prompt = buildManualPrompt(
      [{ name: "WBC", value: 5, unit: "K/uL" }],
      30,
      "attack; DROP TABLE users"
    );
    expect(prompt).toContain("other");
    expect(prompt).not.toContain("DROP TABLE");
  });

  it("truncates long marker names", () => {
    const longName = "A".repeat(200);
    const prompt = buildManualPrompt(
      [{ name: longName, value: 5, unit: "K/uL" }],
      30,
      "male"
    );
    // sanitize truncates at 80 chars
    expect(prompt).not.toContain(longName);
    expect(prompt).toContain("A".repeat(80));
  });

  it("clamps marker value to valid range", () => {
    const prompt = buildManualPrompt(
      [{ name: "WBC", value: 999999, unit: "K/uL" }],
      30,
      "male"
    );
    expect(prompt).toContain("100000");
  });
});

describe("buildFilePrompt", () => {
  it("uses 'image' for image mime types", () => {
    const prompt = buildFilePrompt(30, "female", "image/jpeg");
    expect(prompt).toContain("image");
    expect(prompt).toContain("30-year-old female");
  });

  it("uses 'document' for PDF", () => {
    const prompt = buildFilePrompt(45, "male", "application/pdf");
    expect(prompt).toContain("document");
  });

  it("sanitizes age and gender", () => {
    const prompt = buildFilePrompt(-10, "INVALID", "image/png");
    expect(prompt).toContain("1-year-old other");
  });
});
