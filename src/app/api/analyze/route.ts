import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { analyzeRequestSchema } from "@/lib/validators";
import { analyzeBloodTest } from "@/lib/gemini";
import { checkRateLimit, isAbuser, trackFailure, getRedis } from "@/lib/rate-limit";
import {
  getAuthenticatedUserId,
  tryConsumeUsage,
  checkPaymentStatus,
  refundUsage,
} from "@/lib/usage-tracker";

// Minimum base64 size for a real blood test image (~5KB decoded)
const MIN_FILE_DATA_LENGTH = 6_000;

export async function POST(request: Request) {
  let userId: string | null = null;
  let usageConsumed = false;

  try {
    // Require authentication
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

    // Rate limiting
    const payment = await checkPaymentStatus(userId);
    const isPaid = payment.isPaid || payment.subscriptionStatus === "active";

    const rateLimitResult = await checkRateLimit(userId, isPaid);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Consume usage
    const access = await tryConsumeUsage(userId);
    if (!access.allowed) {
      // Set offer start time if not already set (24h expiry)
      const redis = getRedis();
      if (redis) {
        const key = `offer:${userId}`;
        const existing = await redis.get(key);
        if (!existing) {
          await redis.set(key, Date.now().toString(), { ex: 86400 });
        }
      }
      return NextResponse.json({ error: access.reason }, { status: 402 });
    }
    usageConsumed = true;

    // Call Gemini
    const result = await analyzeBloodTest({
      inputType: parsed.inputType,
      fileData: parsed.fileData,
      mimeType: parsed.mimeType,
      markers: parsed.markers,
      age: parsed.age,
      gender: parsed.gender,
    });

    // If Gemini returned 0 markers, refund and track failure
    if (result.markers.length === 0) {
      await refundUsage(userId);
      usageConsumed = false;
      await trackFailure(userId);
      return NextResponse.json(
        { error: "No blood test markers found in the uploaded file. Please upload a clear image of your blood test results." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "Unknown";

    console.error("Analysis error:", {
      message,
      name: errorName,
      stack: error instanceof Error ? error.stack : undefined,
      userId,
    });

    // Refund usage if it was consumed before the error
    if (usageConsumed && userId) {
      try {
        await refundUsage(userId);
      } catch (refundErr) {
        console.error("Refund failed:", refundErr);
      }
    }

    // Map to user-friendly message
    let userMessage: string;
    let status = 500;

    if (message.includes("timed out")) {
      userMessage = "The analysis took too long. Please try again.";
      status = 504;
    } else if (message.includes("empty response")) {
      userMessage = "Could not read your blood test. Please upload a clearer image or try manual entry.";
      status = 422;
    } else if (message.includes("invalid JSON") || message.includes("failed validation")) {
      userMessage = "Could not interpret the results. Please try again or use manual entry.";
      status = 422;
    } else if (message.includes("API_KEY")) {
      userMessage = "Service is temporarily unavailable. Please try again later.";
    } else if (message.includes("quota") || message.includes("429") || message.includes("rate")) {
      userMessage = "Service is busy. Please try again in a few minutes.";
      status = 503;
    } else if (message.includes("Invalid input")) {
      userMessage = message;
      status = 400;
    } else {
      // Include the actual error for debugging — visible in browser console
      userMessage = `Analysis failed: ${errorName} — ${message}`;
    }

    return NextResponse.json(
      { error: userMessage },
      { status }
    );
  }
}
