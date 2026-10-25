import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { env } from "@/lib/env";

/**
 * Strips potential markdown code fence wrappers from raw LLM responses.
 *
 * @param raw - The raw string response from the Gemini API
 * @returns The cleaned string with markdown fences removed
 * @alignsWith Gemini SDK text output parsing
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
 * Returns a configured GoogleGenerativeAI client using the API key from environment.
 *
 * @returns A new GoogleGenerativeAI instance
 * @alignsWith Google Generative AI SDK initialization
 */
export function getGeminiClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

/**
 * Generates structured JSON output from the Gemini API and validates it against
 * a Zod schema. Uses the `gemini-flash-lite-latest` model with JSON response format.
 *
 * @param prompt - The complete prompt string to send to Gemini
 * @param schema - A Zod schema used to validate and type the parsed response
 * @returns The validated, strongly-typed object matching the provided schema
 * @throws {Error} If the API call fails, response is empty, JSON parsing fails, or Zod validation fails
 * @alignsWith Google Generative AI SDK generateContent API
 */
export async function generateJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const genAI = getGeminiClient();

  const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 2048,
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
