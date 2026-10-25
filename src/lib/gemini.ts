import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { env } from "@/lib/env";
export const MODELS = ["gemini-flash-lite-latest", "gemini-2.5-flash"] as const;

/**
 * Strips potential markdown code fence wrappers from raw LLM responses.
 */
export function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Returns a configured GoogleGenerativeAI client.
 */
export function getGeminiClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

/**
 * Error thrown when Gemini AI generation exceeds timeout limit.
 */
export class GeminiTimeoutError extends Error {
  constructor(message: string = "AI generation timed out. Please try again.") {
    super(message);
    this.name = "GeminiTimeoutError";
  }
}

/**
 * Error thrown when Gemini AI API quota or rate limit is exceeded.
 */
export class RateLimitError extends Error {
  constructor(message: string = "Gemini API quota exceeded. Please try again later.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Strictly dynamic Generative AI invocation that guarantees structured JSON output
 * validated against a runtime Zod schema.
 *
 * ZERO CACHING: Every call hits the Gemini API live in real-time.
 * ZERO MOCK DATA: Never falls back to static fixtures or mock payloads.
 * STRICT TIMEOUT: Enforces a 55-second AbortController timeout to prevent execution timeouts.
 * MODEL SELECTION: Uses active Gemini Flash models (gemini-flash-latest, gemini-2.0-flash, gemini-2.5-flash) with fallback.
 *
 * @param prompt - Formatted system and user prompt
 * @param schema - Zod validation schema for parsing and guaranteeing output integrity
 * @param options - Optional configuration such as custom timeoutMs
 * @returns The strongly typed, schema-validated object
 * @throws RateLimitError if Gemini API quota (429) is exceeded
 * @throws GeminiTimeoutError if AI generation exceeds timeout
 * @throws Error if Gemini API invocation, JSON parsing, or Zod validation fails
 */
export async function generateJSON<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 55000;
  const genAI = getGeminiClient();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let lastError: unknown;

  try {
    for (const modelName of MODELS) {
      if (controller.signal.aborted) {
        throw new GeminiTimeoutError("AI generation timed out. Please try again.");
      }

      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        });

        const response = await model.generateContent(prompt, {
          signal: controller.signal,
        });
        const text = response.response.text();

        if (!text || text.trim().length === 0) {
          throw new Error(`Gemini model ${modelName} returned an empty response`);
        }

        const cleaned = cleanJsonResponse(text);
        const parsed: unknown = JSON.parse(cleaned);

        return schema.parse(parsed);
      } catch (error: unknown) {
        lastError = error;

        // Explicitly check if 429 status or message contains quota to abort immediately
        const isQuotaOrRateLimit =
          (error as { status?: number })?.status === 429 ||
          (error instanceof Error &&
            (error.message.toLowerCase().includes("quota") ||
              error.message.includes("429") ||
              error.name === "RateLimitError"));

        if (isQuotaOrRateLimit) {
          throw new RateLimitError("Gemini API quota exceeded. Please try again later.");
        }

        // If timed out or aborted, stop fallback loop immediately
        if (
          controller.signal.aborted ||
          (error instanceof Error &&
            (error.name === "AbortError" ||
              error.message.toLowerCase().includes("abort") ||
              error.message.toLowerCase().includes("timeout")))
        ) {
          throw new GeminiTimeoutError("AI generation timed out. Please try again.");
        }

        console.warn(
          `[Gemini] Model '${modelName}' failed, trying next fallback model:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    throw lastError || new Error("All Gemini fallback models failed to generate valid response.");
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    if (
      controller.signal.aborted ||
      error instanceof GeminiTimeoutError ||
      (error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.toLowerCase().includes("abort") ||
          error.message.toLowerCase().includes("timeout")))
    ) {
      throw new GeminiTimeoutError("AI generation timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
