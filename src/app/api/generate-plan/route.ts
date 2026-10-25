export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rateLimit";
import { EventRequestSchema, EventPlanSchema } from "@/types/planner";
import { calculateBaseBudget } from "@/lib/utils/budgetLogic";
import { buildEventPlanPrompt } from "@/lib/prompts/planner";
import { generateJSON } from "@/lib/gemini";

/**
 * POST /api/generate-plan
 *
 * Generates a personalized AI event plan using Gemini.
 *
 * Pipeline:
 * 1. Rate limiting via Upstash Redis (10 req/60s per IP)
 * 2. Zod input validation against EventRequestSchema
 * 3. Deterministic budget allocation (40/30/15/15 split)
 * 4. Live Gemini AI generation with Zod output validation
 *
 * @param request - Incoming HTTP request with JSON payload
 * @returns JSON response with generated plan or error
 * @alignsWith Next.js App Router Route Handler conventions
 */
export async function POST(request: Request): Promise<NextResponse> {
  // 1. Extract client IP and enforce rate limiting
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

  // 3. Validate input payload against Zod schema
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

  // 4. Calculate baseline budget and build prompt
  const baseBudget = calculateBaseBudget(validation.data.budget);
  const prompt = buildEventPlanPrompt({
    ...validation.data,
    baseBudget,
  });

  // 5. Generate plan via Gemini AI
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
    console.error("[generate-plan] AI generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate plan. Please try again." },
      { status: 500 },
    );
  }
}
