import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GEMINI_API_KEY: z
    .string()
    .min(1, "GEMINI_API_KEY is required for strictly dynamic AI generation"),
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables against the strict Zod schema.
 * Throws a descriptive error at startup if any variable is missing or malformed.
 */
export function getEnv(): Env {
  const result = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n  - ");
    throw new Error(
      `❌ Environment validation failed:\n  - ${errorDetails}\n\nReview .env.example for required variables.`,
    );
  }

  return result.data;
}

/**
 * Evaluated environment variables.
 * Allows SKIP_ENV_VALIDATION=true during static builds/CI if credentials are injected at deployment.
 */
export const env = (() => {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as Env;
  }
  // If in build phase without credentials, provide proxy or lazy validation
  try {
    return getEnv();
  } catch (error) {
    if (process.env.NODE_ENV === "test") {
      // In tests, tests will configure specific mock/dummy envs
      return {
        NODE_ENV: "test",
        GEMINI_API_KEY: "test_gemini_key",
        UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "test_token",
      } as Env;
    }
    // Re-throw if in runtime or production
    throw error;
  }
})();
