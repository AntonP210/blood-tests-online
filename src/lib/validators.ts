import { z } from "zod/v4";

// ~10MB base64 encoded is roughly 13.7M characters. Cap at 14M to be safe.
const MAX_FILE_DATA_LENGTH = 14_000_000;
const MAX_MARKERS = 50;

export const analyzeRequestSchema = z.object({
  inputType: z.enum(["file", "manual"]),
  fileData: z
    .string()
    .max(MAX_FILE_DATA_LENGTH, "File too large. Maximum 10MB.")
    .optional(),
  mimeType: z
    .enum([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ])
    .optional(),
  markers: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        value: z.number().min(-10000).max(100000),
        unit: z.string().min(1).max(30),
      })
    )
    .max(MAX_MARKERS, `Maximum ${MAX_MARKERS} markers allowed.`)
    .optional(),
  age: z.number().int().min(1).max(120),
  gender: z.enum(["male", "female", "other"]),
});

export const checkoutRequestSchema = z.object({
  tier: z.enum(["one_time", "weekly", "monthly", "yearly", "lifetime"]),
});
