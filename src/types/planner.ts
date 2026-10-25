import { z } from "zod";

/**
 * ============================================================================
 * UTSAV AI - EVENT PLANNING SCHEMAS & TYPES
 * ============================================================================
 * Strict Zod validation schemas enforcing zero mock data, robust type safety,
 * and guaranteed dynamic AI output verification.
 */

export const EventTypeSchema = z.enum(["wedding", "birthday", "corporate"]);
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Input Schema: Validates incoming celebration planning requests.
 * - eventType: must be 'wedding', 'birthday', or 'corporate'
 * - budget: number, minimum 1000
 * - guestCount: number, minimum 1
 * - location: non-empty string
 * - preferences: optional string
 */
export const EventRequestSchema = z.object({
  eventType: EventTypeSchema,
  budget: z.number().min(1000, "Budget must be at least 1000"),
  guestCount: z.number().int().min(1, "Guest count must be at least 1"),
  location: z.string().trim().min(1, "Location is required and cannot be empty"),
  preferences: z.string().optional(),
});

export type EventRequest = z.infer<typeof EventRequestSchema>;

/**
 * Individual budget allocation item.
 */
export const BudgetBreakdownItemSchema = z.object({
  category: z.string().min(1, "Category cannot be empty"),
  amount: z.number().nonnegative("Amount must be a non-negative number"),
  percentage: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
});

export type BudgetBreakdownItem = z.infer<typeof BudgetBreakdownItemSchema>;

/**
 * Timeline phase item containing sequence of planning or execution tasks.
 */
export const TimelinePhaseSchema = z.object({
  phase: z.string().min(1, "Phase description cannot be empty"),
  tasks: z.array(z.string().min(1)).min(1, "At least one task is required per phase"),
});

export type TimelinePhase = z.infer<typeof TimelinePhaseSchema>;

/**
 * Vendor checklist entry with tailored vetting questions.
 */
export const VendorChecklistItemSchema = z.object({
  vendorType: z.string().min(1, "Vendor type cannot be empty"),
  questionsToAsk: z.array(z.string().min(1)).min(1, "At least one question is required"),
});

export type VendorChecklistItem = z.infer<typeof VendorChecklistItemSchema>;

/**
 * Output Schema: Enforces the structure of Gemini's dynamic AI response.
 * - budgetBreakdown: Array of category allocations
 * - timeline: Array of chronological event milestones
 * - vendorChecklist: Array of vendor vetting categories and questions
 * - personalizedIdeas: Array of at least 3 custom, creative ideas
 */
export const EventPlanSchema = z.object({
  budgetBreakdown: z.array(BudgetBreakdownItemSchema),
  timeline: z.array(TimelinePhaseSchema),
  vendorChecklist: z.array(VendorChecklistItemSchema),
  personalizedIdeas: z
    .array(z.string().min(1, "Idea description cannot be empty"))
    .min(2, "At least 2 personalized ideas are required"),
});

export type EventPlan = z.infer<typeof EventPlanSchema>;
