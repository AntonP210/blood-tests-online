import { GoogleGenAI } from "@google/genai";
import type { BloodTestInput, AnalysisResult } from "@/types/blood-test";
import {
  buildManualPrompt,
  buildFilePrompt,
  SYSTEM_INSTRUCTION,
} from "./gemini-prompt";

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Cannot initialize Gemini client."
    );
  }
  return new GoogleGenAI({ apiKey });
}

const GEMINI_TIMEOUT_MS = 60_000;

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";
    if (!text.trim()) {
      throw new Error("Gemini returned an empty response");
    }

    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(text) as AnalysisResult;
    } catch {
      throw new Error("Gemini returned invalid JSON. Please try again.");
    }

    if (!parsed.summary || !Array.isArray(parsed.markers)) {
      throw new Error(
        "Gemini response is missing required fields. Please try again."
      );
    }

    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}
