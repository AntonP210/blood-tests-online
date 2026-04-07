import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { analyzeRequestSchema } from "@/lib/validators";
import { analyzeBloodTest } from "@/lib/gemini";
import { checkRateLimit, isAbuser, trackFailure } from "@/lib/rate-limit";
import {
  getAuthenticatedUserId,
  tryConsumeUsage,
  checkPaymentStatus,
  refundUsage,
} from "@/lib/usage-tracker";

// Minimum base64 size for a real blood test image (~5KB decoded)
const MIN_FILE_DATA_LENGTH = 6_000;

export async function POST(request: Request) {
  try {
    // Require authentication
    let userId: string;
    try {
      userId = await getAuthenticatedUserId();
    } catch {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is temporarily blocked for repeated failures
    if (await isAbuser(userId)) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // Parse and validate input BEFORE consuming usage
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    let parsed;
    try {
      parsed = analyzeRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((i) => i.message);
        return NextResponse.json(
          { error: "Invalid request data", details: messages },
          { status: 400 }
        );
      }
      throw error;
    }

    if (parsed.inputType === "file") {
      if (!parsed.fileData || !parsed.mimeType) {
        return NextResponse.json(
          { error: "File data and MIME type are required for file upload" },
          { status: 400 }
        );
      }
      // Reject trivially small files (likely not a real blood test)
      if (parsed.fileData.length < MIN_FILE_DATA_LENGTH) {
        return NextResponse.json(
          { error: "File is too small to contain blood test results. Please upload a clear image or PDF." },
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

    // Rate limiting (paid users get higher limits)
    const payment = await checkPaymentStatus(userId);
    const isPaid = payment.isPaid || payment.subscriptionStatus === "active";

    const rateLimitResult = await checkRateLimit(userId, isPaid);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Atomically check and consume usage (after validation passes)
    const access = await tryConsumeUsage(userId);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 402 });
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

    // If Gemini returned 0 markers (e.g. unreadable image), refund and track failure
    if (result.markers.length === 0) {
      await refundUsage(userId);
      await trackFailure(userId);
      return NextResponse.json(
        { error: "No blood test markers found in the uploaded file. Please upload a clear image of your blood test results." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    const isKnownError =
      error instanceof Error &&
      (message.includes("Gemini") ||
        message.includes("Invalid input") ||
        message.includes("GEMINI_API_KEY") ||
        message.includes("timed out"));

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
