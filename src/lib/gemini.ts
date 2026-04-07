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

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("500") ||
      msg.includes("503") ||
      msg.includes("429") ||
      msg.includes("rate") ||
      msg.includes("unavailable") ||
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
      text: buildFilePrompt(input.age, input.gender, input.mimeType),
    });
  } else if (input.inputType === "manual" && input.markers) {
    parts.push({
      text: buildManualPrompt(input.markers, input.age, input.gender),
    });
  } else {
    throw new Error("Invalid input: provide either file data or markers");
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }

    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.5-flash",
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
        throw new Error("Gemini returned invalid JSON. Please try again.");
      }

      const result = AnalysisResultSchema.safeParse(rawParsed);
      if (!result.success) {
        throw new Error(
          "Gemini response failed validation. Please try again."
        );
      }

      return result.data;
    } catch (error) {
      lastError = error;

      if (
        error instanceof Error &&
        error.message === "Gemini request timed out"
      ) {
        if (attempt < MAX_RETRIES) continue;
        throw new Error("Analysis timed out. Please try again.");
      }

      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
