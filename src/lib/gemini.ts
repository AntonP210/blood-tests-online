import { GoogleGenAI } from "@google/genai";
import { z } from "zod/v4";
import type { BloodTestInput, AnalysisResult } from "@/types/blood-test";
import {
  buildManualPrompt,
  buildFilePrompt,
  SYSTEM_INSTRUCTION,
} from "./gemini-prompt";

let cachedAI: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (cachedAI) return cachedAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Cannot initialize Gemini client."
    );
  }
  cachedAI = new GoogleGenAI({ apiKey });
  return cachedAI;
}

const GEMINI_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1_000;

// Primary model + fallbacks in priority order
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const AnalyzedMarkerSchema = z.object({
  name: z.string(),
  value: z.coerce.number(),
  unit: z.string(),
  normalRange: z.string().optional().default("N/A"),
  status: z.enum(["normal", "high", "low", "critical"]).catch("normal"),
  explanation: z.string().optional().default(""),
}).passthrough();

const AnalysisResultSchema = z.object({
  summary: z.string(),
  markers: z.array(AnalyzedMarkerSchema),
  recommendations: z.array(z.string()).optional().default([]),
  disclaimer: z.string().optional().default("Please consult your healthcare provider for medical decisions."),
}).passthrough();

function isCapacityError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("503") ||
      msg.includes("429") ||
      msg.includes("overloaded") ||
      msg.includes("unavailable") ||
      msg.includes("high demand") ||
      msg.includes("quota") ||
      msg.includes("rate") ||
      msg.includes("resource has been exhausted")
    );
  }
  return false;
}

function isRetryableError(error: unknown): boolean {
  if (isCapacityError(error)) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("500") ||
      msg.includes("internal") ||
      msg.includes("econnreset") ||
      msg.includes("timeout")
    );
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callModel(
  ai: GoogleGenAI,
  model: string,
  parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>,
): Promise<AnalysisResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }

    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Gemini request timed out")),
            GEMINI_TIMEOUT_MS
          )
        ),
      ]);

      const text = response.text ?? "";
      if (!text.trim()) {
        throw new Error("Gemini returned an empty response");
      }

      let rawParsed: unknown;
      try {
        rawParsed = JSON.parse(text);
      } catch {
        // Some models wrap JSON in markdown code blocks
        const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        try {
          rawParsed = JSON.parse(cleaned);
        } catch {
          console.error("Gemini returned unparseable response:", text.slice(0, 500));
          throw new Error("Gemini returned invalid JSON. Please try again.");
        }
      }

      // Handle cases where response is nested (e.g. { result: { ... } } or array)
      let candidate = rawParsed;
      if (Array.isArray(candidate) && candidate.length === 1) {
        candidate = candidate[0];
      }
      if (
        candidate &&
        typeof candidate === "object" &&
        !("summary" in candidate) &&
        "result" in candidate
      ) {
        candidate = (candidate as Record<string, unknown>).result;
      }

      const result = AnalysisResultSchema.safeParse(candidate);
      if (!result.success) {
        console.error("Gemini validation failed:", JSON.stringify(result.error.issues, null, 2));
        console.error("Raw response shape:", JSON.stringify(candidate, null, 2).slice(0, 1000));
        throw new Error("Gemini response failed validation. Please try again.");
      }

      return result.data;
    } catch (error) {
      lastError = error;

      if (
        error instanceof Error &&
        error.message === "Gemini request timed out"
      ) {
        if (attempt < MAX_RETRIES) continue;
        throw error;
      }

      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export async function analyzeBloodTest(
  input: BloodTestInput
): Promise<AnalysisResult> {
  const ai = getAI();
  const parts: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  > = [];

  if (input.inputType === "file" && input.fileData && input.mimeType) {
    parts.push({
      inlineData: {
        data: input.fileData,
        mimeType: input.mimeType,
      },
    });
    parts.push({
      text: buildFilePrompt(input.age, input.gender, input.mimeType, input.locale),
    });
  } else if (input.inputType === "manual" && input.markers) {
    parts.push({
      text: buildManualPrompt(input.markers, input.age, input.gender, input.locale),
    });
  } else {
    throw new Error("Invalid input: provide either file data or markers");
  }

  // Try each model in order — fall back on capacity errors
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      console.log(`Attempting analysis with model: ${model}`);
      return await callModel(ai, model, parts);
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed:`, error instanceof Error ? error.message : error);

      // Only fall back to next model on capacity errors
      if (isCapacityError(error)) {
        console.log(`Falling back to next model...`);
        continue;
      }

      // Non-capacity errors (validation, timeout, etc.) — don't try other models
      throw error;
    }
  }

  throw lastError;
}
