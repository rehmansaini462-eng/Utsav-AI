export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import { EventRequestSchema, EventPlanSchema } from "@/types/planner";
import { calculateBaseBudget } from "@/lib/utils/budgetLogic";
import { buildEventPlanPrompt } from "@/lib/prompts/planner";
import { generateJSON, GeminiTimeoutError } from "@/lib/gemini";

/**
 * ============================================================================
 * UTSAV AI - EVENT PLAN GENERATION ROUTE HANDLER
 * ============================================================================
 *
 * ### Architectural Pipeline:
 * 1. **Distributed Rate Limiting (Upstash Redis)**:
 *    - Enforces a sliding window limit of 10 requests per 60 seconds per client IP.
 *    - Safeguards upstream Gemini API quotas and protects serverless resources against abuse.
 *    - Responds with HTTP 429 and standard rate-limiting headers if quota is exceeded.
 *
 * 2. **Strict Zod Input Validation**:
 *    - Validates incoming payload against `EventRequestSchema`.
 *    - Enforces minimum budget threshold (>= 1000), valid eventType, positive guest count,
 *      and non-empty location strings.
 *    - Responds with HTTP 400 and explicit descriptive error messages on failure.
 *
 * 3. **Deterministic Algorithmic Budget Calculation**:
 *    - Executes `calculateBaseBudget` (pure function) to derive baseline allocations
 *      (40% Catering, 30% Venue, 15% Decor, 15% Misc).
 *
 * 4. **Live Dynamic Generative AI Synthesis (Gemini 2.5/Flash)**:
 *    - Calls `generateJSON` using `EventPlanSchema`.
 *    - Forces JSON output format from LLM and validates parsed structure at runtime.
 *    - ZERO CACHING: Every generation is dynamically computed in real-time.
 *
 * 5. **Zero Mock Data Resilience Policy**:
 *    - If Gemini API fails, network times out, or output schema fails validation,
 *      an HTTP 500 error is returned with "AI generation failed. Please try again."
 *    - CRITICAL: Under no circumstances does this endpoint return synthetic or mock fallback data.
 *
 * @param request - Web API Request object containing JSON payload
 * @returns {Promise<NextResponse>} JSON response containing the generated plan or descriptive error
 */
export async function POST(request: Request): Promise<NextResponse> {
  // 1. Extract client IP and enforce sliding window rate limiting
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const clientIp = forwardedFor
    ? forwardedFor.split(",")[0]?.trim() || "127.0.0.1"
    : realIp || "127.0.0.1";

  const rateLimitResult = await checkRateLimit(clientIp);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(
            Math.max(0, rateLimitResult.reset - Date.now()) / 1000,
          ).toString(),
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      },
    );
  }

  // 2. Parse request JSON body safely
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  // 3. Validate input payload against strict Zod schema
  const validation = EventRequestSchema.safeParse(body);
  if (!validation.success) {
    const errorMessage = validation.error.issues.map((issue) => issue.message).join("; ");
    return NextResponse.json(
      {
        error: errorMessage || "Validation failed for event request",
        details: validation.error.flatten(),
      },
      { status: 400 },
    );
  }

  // 4. Calculate pure mathematical baseline budget and assemble prompt
  const baseBudget = calculateBaseBudget(validation.data.budget);
  const prompt = buildEventPlanPrompt({
    ...validation.data,
    baseBudget,
  });

  // 5. Invoke Gemini with runtime Zod output schema enforcement
  try {
    const plan = await generateJSON(prompt, EventPlanSchema);

    return NextResponse.json(
      {
        success: true,
        data: plan,
        ...plan,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("[generate-plan] Dynamic AI generation failed:", error);

    const isTimeout =
      error instanceof GeminiTimeoutError ||
      (error instanceof Error &&
        (error.message === "AI generation timed out. Please try again." ||
          error.name === "GeminiTimeoutError" ||
          error.name === "AbortError" ||
          error.message.includes("AI generation timed out") ||
          error.message.includes("The operation was aborted")));

    if (isTimeout) {
      return NextResponse.json(
        { error: "AI generation timed out. Please try again." },
        { status: 504 },
      );
    }

    // CRITICAL: Return 500 error with strict zero-mock policy
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
