import { describe, it, expect } from "vitest";
import { APP_NAME, GEMINI_MODEL, RATE_LIMIT_CONFIG } from "@/config/constants";
import { envSchema } from "@/lib/env";

describe("Utsav AI - Quality Foundation Tests", () => {
  it("should have correct application constants configured", () => {
    expect(APP_NAME).toBe("Utsav AI");
    expect(GEMINI_MODEL).toBe("gemini-2.5-flash");
    expect(RATE_LIMIT_CONFIG.MAX_REQUESTS).toBe(10);
    expect(RATE_LIMIT_CONFIG.WINDOW).toBe("60 s");
  });

  it("should validate valid environment configuration through Zod schema", () => {
    const validConfig = {
      NODE_ENV: "production" as const,
      GEMINI_API_KEY: "valid_api_key_sample",
      UPSTASH_REDIS_REST_URL: "https://sample-redis.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "valid_sample_token",
    };

    const parsed = envSchema.safeParse(validConfig);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.GEMINI_API_KEY).toBe("valid_api_key_sample");
      expect(parsed.data.UPSTASH_REDIS_REST_URL).toBe("https://sample-redis.upstash.io");
    }
  });

  it("should reject missing or malformed environment variables", () => {
    const invalidConfig = {
      NODE_ENV: "production",
      GEMINI_API_KEY: "",
      UPSTASH_REDIS_REST_URL: "not-a-valid-url",
      UPSTASH_REDIS_REST_TOKEN: "",
    };

    const parsed = envSchema.safeParse(invalidConfig);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issuePaths = parsed.error.issues.map((i) => i.path[0]);
      expect(issuePaths).toContain("GEMINI_API_KEY");
      expect(issuePaths).toContain("UPSTASH_REDIS_REST_URL");
      expect(issuePaths).toContain("UPSTASH_REDIS_REST_TOKEN");
    }
  });
});
