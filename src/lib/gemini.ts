import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { env } from "@/lib/env";
import { GEMINI_MODEL } from "@/config/constants";

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
 * Strictly dynamic Generative AI invocation that guarantees structured JSON output
 * validated against a runtime Zod schema.
 *
 * ZERO CACHING: Every call hits the Gemini API live in real-time.
 * ZERO MOCK DATA: Never falls back to static fixtures or mock payloads.
 * STRICT TIMEOUT: Enforces a 30-second AbortController timeout to prevent Vercel execution timeouts.
 *
 * @param prompt - Formatted system and user prompt
 * @param schema - Zod validation schema for parsing and guaranteeing output integrity
 * @param options - Optional configuration such as custom timeoutMs
 * @returns The strongly typed, schema-validated object
 * @throws GeminiTimeoutError if AI generation exceeds 30 seconds
 * @throws Error if Gemini API invocation, JSON parsing, or Zod validation fails
 */
export async function generateJSON<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 30000;
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await model.generateContent(prompt, {
      signal: controller.signal,
    });
    const text = response.response.text();

    if (!text || text.trim().length === 0) {
      throw new Error("Gemini returned an empty response");
    }

    const cleaned = cleanJsonResponse(text);
    const parsed: unknown = JSON.parse(cleaned);

    return schema.parse(parsed);
  } catch (error: unknown) {
    if (
      controller.signal.aborted ||
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
