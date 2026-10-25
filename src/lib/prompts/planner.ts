import { EventRequest } from "@/types/planner";
import { calculateBaseBudget, BaseBudgetAllocation } from "@/lib/utils/budgetLogic";

/**
 * Input structure for building the event planner prompt.
 */
export interface EventPlanPromptInput extends EventRequest {
  baseBudget?: BaseBudgetAllocation[];
}

/**
 * Builds a strictly formatted, zero-cache dynamic prompt instructing Gemini
 * to synthesize a complete celebration plan adhering strictly to the EventPlan schema.
 *
 * @param data - The user event request and optional pre-calculated base budget
 * @returns The prompt string to be passed to Gemini
 */
export function buildEventPlanPrompt(data: EventPlanPromptInput): string {
  const baseBudget = data.baseBudget ?? calculateBaseBudget(data.budget);

  const budgetTable = baseBudget
    .map((item) => `- ${item.category}: ${item.amount} (${item.percentage}%)`)
    .join("\n");

  return `You are the event planner for Utsav AI. Generate a concise, practical celebration plan:

=== EVENT SPECIFICATIONS ===
- Event Type: ${data.eventType}
- Total Budget: ${data.budget}
- Guest Count: ${data.guestCount}
- Location: ${data.location}
- User Preferences: ${data.preferences?.trim() ? data.preferences.trim() : "Culturally authentic celebration for " + data.location}

=== ALGORITHMIC BASE BUDGET ANCHOR ===
${budgetTable}

=== REQUIRED OUTPUT STRUCTURE (JSON ONLY) ===
{
  "budgetBreakdown": [
    { "category": "Catering", "amount": 0, "percentage": 40 },
    { "category": "Venue", "amount": 0, "percentage": 30 },
    { "category": "Decor", "amount": 0, "percentage": 15 },
    { "category": "Miscellaneous", "amount": 0, "percentage": 15 }
  ],
  "timeline": [
    { "phase": "string", "tasks": ["string"] }
  ],
  "vendorChecklist": [
    { "vendorType": "string", "questionsToAsk": ["string"] }
  ],
  "personalizedIdeas": ["string"]
}

=== CRITICAL RULES ===
1. STRICT JSON ONLY: Return raw JSON only adhering to the schema above. Do NOT use markdown code blocks (\`\`\`json or \`\`\`). No conversational text.
2. TOTAL BUDGET ALIGNMENT: budgetBreakdown amounts must sum exactly to ${data.budget} and match the 4 categories (Catering, Venue, Decor, Miscellaneous).
3. Provide practical milestones for the timeline, essential vendor questions, and personalized celebration ideas tailored to the event specifications.`;
}
