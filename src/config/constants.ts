/**
 * Application Constants
 * Production-grade centralized constants for Utsav AI.
 * Strict dynamic architecture - Zero caching policies.
 */

export const APP_NAME = "Utsav AI" as const;
export const APP_DESCRIPTION = "Intelligent AI-driven Indian Celebration & Event Planner" as const;

/**
 * Gemini AI Model Selection
 * Using gemini-2.5-flash for optimal speed (<15s), real-time dynamic response generation, and zero-cache evaluation.
 */
export const GEMINI_MODEL = "gemini-2.5-flash" as const;

/**
 * Rate Limiting Config
 * Distributed sliding window rate limit configuration powered by Upstash Redis.
 */
export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 10,
  WINDOW: "60 s",
} as const;
