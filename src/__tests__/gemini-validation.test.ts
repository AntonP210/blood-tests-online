import { describe, it, expect } from "vitest";
import { z } from "zod/v4";

// Re-define the schema here to test it in isolation (same as in gemini.ts)
const AnalyzedMarkerSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  normalRange: z.string(),
  status: z.enum(["normal", "high", "low", "critical"]),
  explanation: z.string(),
});

const AnalysisResultSchema = z.object({
  summary: z.string(),
  markers: z.array(AnalyzedMarkerSchema),
  recommendations: z.array(z.string()),
  disclaimer: z.string(),
});

describe("AnalysisResultSchema", () => {
  const validResult = {
    summary: "Overall results look good.",
    markers: [
      {
        name: "Hemoglobin",
        value: 14.5,
        unit: "g/dL",
        normalRange: "12.0-17.5",
        status: "normal" as const,
        explanation: "Your hemoglobin is within normal range.",
      },
    ],
    recommendations: ["Maintain a balanced diet."],
    disclaimer: "Consult your doctor.",
  };

  it("accepts a valid analysis result", () => {
    const result = AnalysisResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  it("accepts result with empty markers array", () => {
    const result = AnalysisResultSchema.safeParse({
      ...validResult,
      markers: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts result with empty recommendations", () => {
    const result = AnalysisResultSchema.safeParse({
      ...validResult,
      recommendations: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing summary", () => {
    const { summary, ...rest } = validResult;
    const result = AnalysisResultSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing markers", () => {
    const { markers, ...rest } = validResult;
    const result = AnalysisResultSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing disclaimer", () => {
    const { disclaimer, ...rest } = validResult;
    const result = AnalysisResultSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing recommendations", () => {
    const { recommendations, ...rest } = validResult;
    const result = AnalysisResultSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects marker with invalid status", () => {
    const result = AnalysisResultSchema.safeParse({
      ...validResult,
      markers: [
        {
          ...validResult.markers[0],
          status: "danger",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects marker with string value instead of number", () => {
    const result = AnalysisResultSchema.safeParse({
      ...validResult,
      markers: [
        {
          ...validResult.markers[0],
          value: "14.5",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects marker with missing fields", () => {
    const result = AnalysisResultSchema.safeParse({
      ...validResult,
      markers: [{ name: "Hemoglobin" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid status values", () => {
    const statuses = ["normal", "high", "low", "critical"] as const;
    for (const status of statuses) {
      const result = AnalysisResultSchema.safeParse({
        ...validResult,
        markers: [{ ...validResult.markers[0], status }],
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects non-string recommendations", () => {
    const result = AnalysisResultSchema.safeParse({
      ...validResult,
      recommendations: [123],
    });
    expect(result.success).toBe(false);
  });

  it("rejects completely wrong shape", () => {
    const result = AnalysisResultSchema.safeParse({
      text: "some response",
    });
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = AnalysisResultSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects string", () => {
    const result = AnalysisResultSchema.safeParse("not an object");
    expect(result.success).toBe(false);
  });

  it("accepts multiple markers", () => {
    const result = AnalysisResultSchema.safeParse({
      ...validResult,
      markers: [
        validResult.markers[0],
        {
          name: "WBC",
          value: 7.2,
          unit: "K/uL",
          normalRange: "4.5-11.0",
          status: "normal",
          explanation: "White blood cell count is normal.",
        },
        {
          name: "Glucose",
          value: 250,
          unit: "mg/dL",
          normalRange: "70-100",
          status: "critical",
          explanation: "Very high glucose level.",
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
