import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { analyzeRequestSchema } from "@/lib/validators";
import { analyzeBloodTest } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getOrCreateSessionId,
  tryConsumeUsage,
  checkPaymentStatus,
} from "@/lib/usage-tracker";

export async function POST(request: Request) {
  try {
    // Rate limiting by IP (paid users get higher limits)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const sessionId = await getOrCreateSessionId();
    const payment = await checkPaymentStatus(sessionId);
    const isPaid = payment.isPaid || payment.subscriptionStatus === "active";

    const rateLimitResult = await checkRateLimit(ip, isPaid);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Atomically check and consume usage
    const access = await tryConsumeUsage(sessionId);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 402 });
    }

    // Parse and validate input
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parsed = analyzeRequestSchema.parse(body);

    if (parsed.inputType === "file") {
      if (!parsed.fileData || !parsed.mimeType) {
        return NextResponse.json(
          { error: "File data and MIME type are required for file upload" },
          { status: 400 }
        );
      }
    } else if (parsed.inputType === "manual") {
      if (!parsed.markers || parsed.markers.length === 0) {
        return NextResponse.json(
          { error: "At least one marker is required for manual entry" },
          { status: 400 }
        );
      }
    }

    // Call Gemini
    const result = await analyzeBloodTest({
      inputType: parsed.inputType,
      fileData: parsed.fileData,
      mimeType: parsed.mimeType,
      markers: parsed.markers,
      age: parsed.age,
      gender: parsed.gender,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    // Don't leak internal details for unknown errors
    const isKnownError =
      error instanceof Error &&
      (message.includes("Gemini") ||
        message.includes("Invalid input") ||
        message.includes("GEMINI_API_KEY"));

    return NextResponse.json(
      {
        error: isKnownError
          ? message
          : "Failed to analyze blood test. Please try again.",
      },
      { status: 500 }
    );
  }
}
