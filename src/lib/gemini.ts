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
 * Strictly dynamic Generative AI invocation that guarantees structured JSON output
 * validated against a runtime Zod schema.
 *
 * ZERO CACHING: Every call hits the Gemini API live in real-time.
 * ZERO MOCK DATA: Never falls back to static fixtures or mock payloads.
 *
 * @param prompt - Formatted system and user prompt
 * @param schema - Zod validation schema for parsing and guaranteeing output integrity
 * @returns The strongly typed, schema-validated object
 * @throws Error if Gemini API invocation, JSON parsing, or Zod validation fails
 */
export async function generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const response = await model.generateContent(prompt);
  const text = response.response.text();

  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned an empty response");
  }

  const cleaned = cleanJsonResponse(text);
  const parsed: unknown = JSON.parse(cleaned);

  return schema.parse(parsed);
}
