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

  return `You are the master celebration planner and AI architect for Utsav AI, the premier intelligent Indian & global event planning platform.

Plan a comprehensive, culturally rich, and highly practical event based on the following verified specifications:

=== EVENT SPECIFICATIONS ===
- Event Type: ${data.eventType}
- Total Budget: ${data.budget}
- Guest Count: ${data.guestCount}
- Location: ${data.location}
- User Preferences / Notes: ${data.preferences?.trim() ? data.preferences.trim() : "None provided. Apply culturally vibrant best practices for " + data.location + "."}

=== ALGORITHMIC BASE BUDGET ANCHOR ===
The algorithmic engine has computed the following baseline distribution:
${budgetTable}

Use this financial allocation as your foundational guide. Tailor the specific categories, amounts, and percentages realistically for a ${data.eventType} in ${data.location} with ${data.guestCount} guests. Ensure the sum of amounts strictly aligns with the total budget of ${data.budget}.

=== REQUIRED OUTPUT STRUCTURE (JSON ONLY) ===
You must generate a single, strictly valid JSON object matching this exact schema:
{
  "budgetBreakdown": [
    {
      "category": "string (e.g., Catering & Beverages, Venue & Logistics, Decor & Styling, Miscellaneous)",
      "amount": number (exact numerical value),
      "percentage": number (numerical percentage, e.g. 40)
    }
  ],
  "timeline": [
    {
      "phase": "string (e.g., 8-12 Weeks Before, 4 Weeks Before, Week of Event, Event Day)",
      "tasks": ["string (actionable, detailed task)"]
    }
  ],
  "vendorChecklist": [
    {
      "vendorType": "string (e.g., Caterer, Decorator/Florist, Photographer/Cinematographer, Sound & Lights)",
      "questionsToAsk": ["string (critical vetting question)"]
    }
  ],
  "personalizedIdeas": [
    "string (at least 3 unique, innovative, culturally resonant ideas specifically customized for this celebration)"
  ]
}

=== CRITICAL RULES ===
1. STRICT JSON ONLY: Output ONLY the raw JSON object. Do NOT enclose in markdown code blocks (\`\`\`json or \`\`\`). Do NOT include any conversational prefix, explanations, or commentary.
2. PERSONALIZED IDEAS: Provide at least 3 distinct, creative, and memorable ideas reflecting the celebration atmosphere of ${data.eventType} in ${data.location}.
3. REALISTIC & PRACTICAL: All vendor questions, timeline milestones, and budget items must reflect real-world event coordination standards.
4. STRICT LENGTH LIMIT (<500 WORDS TOTAL): Be concise, direct, and punchy. To minimize generation latency and prevent timeouts, do not generate excessively long text for ideas or vendor questions. Keep the total content strictly under 500 words.`;
}
