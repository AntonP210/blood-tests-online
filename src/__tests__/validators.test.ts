import { describe, it, expect } from "vitest";
import { analyzeRequestSchema, checkoutRequestSchema } from "@/lib/validators";

describe("analyzeRequestSchema", () => {
  it("accepts valid file input", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "file",
      fileData: "base64data",
      mimeType: "image/jpeg",
      age: 30,
      gender: "male",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid manual input", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "manual",
      markers: [{ name: "Hemoglobin", value: 14.5, unit: "g/dL" }],
      age: 45,
      gender: "female",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid input type", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "audio",
      age: 30,
      gender: "male",
    });
    expect(result.success).toBe(false);
  });

  it("rejects age below 1", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "manual",
      markers: [{ name: "WBC", value: 5, unit: "K/uL" }],
      age: 0,
      gender: "male",
    });
    expect(result.success).toBe(false);
  });

  it("rejects age above 120", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "manual",
      markers: [{ name: "WBC", value: 5, unit: "K/uL" }],
      age: 121,
      gender: "male",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid gender", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "manual",
      markers: [{ name: "WBC", value: 5, unit: "K/uL" }],
      age: 30,
      gender: "unknown",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid mime type", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "file",
      fileData: "data",
      mimeType: "text/html",
      age: 30,
      gender: "male",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid mime types", () => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ];
    for (const mimeType of validTypes) {
      const result = analyzeRequestSchema.safeParse({
        inputType: "file",
        fileData: "data",
        mimeType,
        age: 25,
        gender: "female",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects marker with empty name", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "manual",
      markers: [{ name: "", value: 5, unit: "K/uL" }],
      age: 30,
      gender: "male",
    });
    expect(result.success).toBe(false);
  });

  it("rejects marker value below minimum", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "manual",
      markers: [{ name: "WBC", value: -10001, unit: "K/uL" }],
      age: 30,
      gender: "male",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 markers", () => {
    const markers = Array.from({ length: 51 }, (_, i) => ({
      name: `Marker${i}`,
      value: 5,
      unit: "mg/dL",
    }));
    const result = analyzeRequestSchema.safeParse({
      inputType: "manual",
      markers,
      age: 30,
      gender: "male",
    });
    expect(result.success).toBe(false);
  });

  it("rejects file data exceeding 14M characters", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "file",
      fileData: "x".repeat(14_000_001),
      mimeType: "image/png",
      age: 30,
      gender: "male",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer age", () => {
    const result = analyzeRequestSchema.safeParse({
      inputType: "manual",
      markers: [{ name: "WBC", value: 5, unit: "K/uL" }],
      age: 30.5,
      gender: "male",
    });
    expect(result.success).toBe(false);
  });
});

describe("checkoutRequestSchema", () => {
  it("accepts valid tiers", () => {
    const validTiers = ["one_time", "weekly", "monthly", "yearly", "lifetime"];
    for (const tier of validTiers) {
      const result = checkoutRequestSchema.safeParse({ tier });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid tier", () => {
    const result = checkoutRequestSchema.safeParse({ tier: "free" });
    expect(result.success).toBe(false);
  });

  it("rejects missing tier", () => {
    const result = checkoutRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
