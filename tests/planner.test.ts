import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateBaseBudget } from "@/lib/utils/budgetLogic";
import { EventRequestSchema, EventPlanSchema, EventPlan } from "@/types/planner";
import { buildEventPlanPrompt } from "@/lib/prompts/planner";

// Mock Gemini and RateLimiter modules for deterministic, isolated unit testing
vi.mock("@/lib/gemini", () => {
  class GeminiTimeoutError extends Error {
    constructor(message: string = "AI generation timed out. Please try again.") {
      super(message);
      this.name = "GeminiTimeoutError";
    }
  }
  class RateLimitError extends Error {
    constructor(message: string = "Gemini API quota exceeded. Please try again later.") {
      super(message);
      this.name = "RateLimitError";
    }
  }
  return {
    generateJSON: vi.fn(),
    cleanJsonResponse: vi.fn((str: string) => str),
    GeminiTimeoutError,
    RateLimitError,
  };
});

vi.mock("@/lib/utils/rateLimit", () => ({
  checkRateLimit: vi.fn(),
  getRateLimiter: vi.fn(),
  getRedisClient: vi.fn(),
  ratelimit: {
    limit: vi.fn(),
  },
}));

import { POST } from "@/app/api/generate-plan/route";
import { generateJSON } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/utils/rateLimit";

const mockPlanData: EventPlan = {
  budgetBreakdown: [
    { category: "Catering", amount: 40000, percentage: 40 },
    { category: "Venue", amount: 30000, percentage: 30 },
    { category: "Decor", amount: 15000, percentage: 15 },
    { category: "Miscellaneous", amount: 15000, percentage: 15 },
  ],
  timeline: [
    {
      phase: "8 Weeks Before",
      tasks: ["Reserve venue", "Shortlist caterers"],
    },
    {
      phase: "Event Day",
      tasks: ["Stage setup verification", "Guest reception coordination"],
    },
  ],
  vendorChecklist: [
    {
      vendorType: "Caterer",
      questionsToAsk: ["Are live counters included?", "What is the guest cancellation policy?"],
    },
    {
      vendorType: "Decorator",
      questionsToAsk: ["Do you supply ambient stage lighting?", "Is setup done 4 hours prior?"],
    },
  ],
  personalizedIdeas: [
    "Royal Rajasthani folk welcoming troupe with dhol and flower shower",
    "Digital interactive memory wall where guests upload photos via QR code",
    "Custom fragrance bar blending organic attars for personalized guest take-home gifts",
  ],
};

describe("Day 1: Utsav AI Core Logic & GenAI Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Pure Algorithmic Logic: calculateBaseBudget", () => {
    it("should accurately split budget with 40% Catering, 30% Venue, 15% Decor, and 15% Misc", () => {
      const budget = 100000;
      const breakdown = calculateBaseBudget(budget);

      expect(breakdown).toHaveLength(4);

      const catering = breakdown.find((b) => b.category === "Catering");
      const venue = breakdown.find((b) => b.category === "Venue");
      const decor = breakdown.find((b) => b.category === "Decor");
      const misc = breakdown.find((b) => b.category === "Miscellaneous");

      expect(catering).toBeDefined();
      expect(catering?.amount).toBe(40000);
      expect(catering?.percentage).toBe(40);

      expect(venue).toBeDefined();
      expect(venue?.amount).toBe(30000);
      expect(venue?.percentage).toBe(30);

      expect(decor).toBeDefined();
      expect(decor?.amount).toBe(15000);
      expect(decor?.percentage).toBe(15);

      expect(misc).toBeDefined();
      expect(misc?.amount).toBe(15000);
      expect(misc?.percentage).toBe(15);
    });

    it("should guarantee that category percentages sum up to exactly 100%", () => {
      const breakdown = calculateBaseBudget(50000);
      const totalPercentage = breakdown.reduce((sum, item) => sum + item.percentage, 0);
      expect(totalPercentage).toBe(100);
    });

    it("should guarantee that allocated amounts sum up to the total budget", () => {
      const testBudgets = [1000, 7500, 12345, 100000, 2500000];

      for (const budget of testBudgets) {
        const breakdown = calculateBaseBudget(budget);
        const totalAllocated = breakdown.reduce((sum, item) => sum + item.amount, 0);
        expect(Math.abs(totalAllocated - budget)).toBeLessThanOrEqual(0.01);
      }
    });

    it("should throw an error if budget is invalid, negative, or not a number", () => {
      expect(() => calculateBaseBudget(-500)).toThrow("Total budget must be a non-negative number");
      expect(() => calculateBaseBudget(NaN)).toThrow("Total budget must be a non-negative number");
      // @ts-expect-error Testing runtime invalid input
      expect(() => calculateBaseBudget("50000")).toThrow(
        "Total budget must be a non-negative number",
      );
    });
  });

  describe("2. Strict Zod Schema Validation", () => {
    describe("EventRequestSchema", () => {
      it("should accept valid event requests with optional preferences", () => {
        const validPayload = {
          eventType: "wedding" as const,
          budget: 500000,
          guestCount: 200,
          location: "Jaipur",
          preferences: "Royal traditional palace theme",
        };

        const result = EventRequestSchema.safeParse(validPayload);
        expect(result.success).toBe(true);
      });

      it("should accept valid event requests without preferences", () => {
        const validPayload = {
          eventType: "birthday" as const,
          budget: 25000,
          guestCount: 30,
          location: "Bengaluru",
        };

        const result = EventRequestSchema.safeParse(validPayload);
        expect(result.success).toBe(true);
      });

      it("should reject budgets below 1000", () => {
        const lowBudgetPayload = {
          eventType: "birthday" as const,
          budget: 999,
          guestCount: 10,
          location: "Delhi",
        };

        const result = EventRequestSchema.safeParse(lowBudgetPayload);
        expect(result.success).toBe(false);
        if (!result.success) {
          const budgetIssue = result.error.issues.find((i) => i.path.includes("budget"));
          expect(budgetIssue?.message).toContain("Budget must be at least 1000");
        }
      });

      it("should reject empty or whitespace-only location strings", () => {
        const emptyLocationPayload = {
          eventType: "corporate" as const,
          budget: 150000,
          guestCount: 50,
          location: "   ",
        };

        const result = EventRequestSchema.safeParse(emptyLocationPayload);
        expect(result.success).toBe(false);
        if (!result.success) {
          const locationIssue = result.error.issues.find((i) => i.path.includes("location"));
          expect(locationIssue?.message).toContain("Location is required and cannot be empty");
        }
      });

      it("should reject invalid eventType values", () => {
        const invalidTypePayload = {
          eventType: "festival",
          budget: 50000,
          guestCount: 40,
          location: "Mumbai",
        };

        const result = EventRequestSchema.safeParse(invalidTypePayload);
        expect(result.success).toBe(false);
      });

      it("should reject guest counts less than 1", () => {
        const zeroGuestPayload = {
          eventType: "wedding" as const,
          budget: 200000,
          guestCount: 0,
          location: "Goa",
        };

        const result = EventRequestSchema.safeParse(zeroGuestPayload);
        expect(result.success).toBe(false);
      });
    });

    describe("EventPlanSchema", () => {
      it("should validate a complete and properly formed EventPlan", () => {
        const result = EventPlanSchema.safeParse(mockPlanData);
        expect(result.success).toBe(true);
      });

      it("should reject EventPlan with fewer than 3 personalized ideas", () => {
        const invalidPlan = {
          ...mockPlanData,
          personalizedIdeas: ["Idea 1", "Idea 2"], // Only 2 ideas
        };

        const result = EventPlanSchema.safeParse(invalidPlan);
        expect(result.success).toBe(false);
        if (!result.success) {
          const ideaIssue = result.error.issues.find((i) => i.path.includes("personalizedIdeas"));
          expect(ideaIssue?.message).toContain("At least 3 personalized ideas are required");
        }
      });

      it("should reject EventPlan missing essential timeline tasks", () => {
        const invalidPlan = {
          ...mockPlanData,
          timeline: [{ phase: "Day 1", tasks: [] }],
        };

        const result = EventPlanSchema.safeParse(invalidPlan);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("3. Prompt Builder: buildEventPlanPrompt", () => {
    it("should assemble a complete prompt containing user inputs and algorithmic base budget", () => {
      const prompt = buildEventPlanPrompt({
        eventType: "wedding",
        budget: 500000,
        guestCount: 300,
        location: "Udaipur",
        preferences: "Lakeside sunset banquet",
      });

      expect(prompt).toContain("Event Type: wedding");
      expect(prompt).toContain("Total Budget: 500000");
      expect(prompt).toContain("Guest Count: 300");
      expect(prompt).toContain("Location: Udaipur");
      expect(prompt).toContain("Lakeside sunset banquet");
      expect(prompt).toContain("Catering: 200000 (40%)");
      expect(prompt).toContain("Venue: 150000 (30%)");
      expect(prompt).toContain("budgetBreakdown");
      expect(prompt).toContain("timeline");
      expect(prompt).toContain("vendorChecklist");
      expect(prompt).toContain("personalizedIdeas");
      expect(prompt).toContain("STRICT JSON ONLY");
    });
  });

  describe("4. API Route: POST /api/generate-plan", () => {
    const validBody = {
      eventType: "wedding",
      budget: 100000,
      guestCount: 150,
      location: "Delhi",
      preferences: "Grand traditional theme",
    };

    it("should successfully generate plan when rate limit permits and Gemini responds", () => {
      return new Promise<void>(async (resolve) => {
        vi.mocked(checkRateLimit).mockResolvedValueOnce({
          success: true,
          limit: 10,
          remaining: 9,
          reset: Date.now() + 60000,
        });

        vi.mocked(generateJSON).mockResolvedValueOnce(mockPlanData);

        const request = new Request("http://localhost:3000/api/generate-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "192.168.1.1",
          },
          body: JSON.stringify(validBody),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.budgetBreakdown).toHaveLength(4);
        expect(data.personalizedIdeas).toHaveLength(3);
        expect(generateJSON).toHaveBeenCalledTimes(1);
        resolve();
      });
    });

    it("should return HTTP 429 when rate limit is exceeded", async () => {
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 30000,
      });

      const request = new Request("http://localhost:3000/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.0.0.1",
        },
        body: JSON.stringify(validBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Rate limit exceeded. Please wait.");
      expect(generateJSON).not.toHaveBeenCalled();
    });

    it("should return HTTP 400 when input validation fails (e.g. budget < 1000)", async () => {
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 8,
        reset: Date.now() + 60000,
      });

      const badRequest = new Request("http://localhost:3000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validBody,
          budget: 500, // Below minimum 1000
        }),
      });

      const response = await POST(badRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Budget must be at least 1000");
      expect(generateJSON).not.toHaveBeenCalled();
    });

    it("should return HTTP 400 when location is empty", async () => {
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 8,
        reset: Date.now() + 60000,
      });

      const badLocationRequest = new Request("http://localhost:3000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validBody,
          location: "",
        }),
      });

      const response = await POST(badLocationRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Location is required and cannot be empty");
      expect(generateJSON).not.toHaveBeenCalled();
    });

    it("should return HTTP 500 with exact error message when Gemini AI fails (Zero Mock Data enforcement)", async () => {
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 7,
        reset: Date.now() + 60000,
      });

      // Mock Gemini throwing an unexpected API or quota error
      vi.mocked(generateJSON).mockRejectedValueOnce(
        new Error("Gemini quota exceeded / network timeout"),
      );

      const request = new Request("http://localhost:3000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("AI generation failed. Please try again.");
      // Confirm absolute zero mock data returned
      expect(data.budgetBreakdown).toBeUndefined();
      expect(data.timeline).toBeUndefined();
      expect(data.personalizedIdeas).toBeUndefined();
    });

    it("should return HTTP 504 with timeout error message when Gemini AI times out", async () => {
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 7,
        reset: Date.now() + 60000,
      });

      // Mock Gemini throwing timeout error
      vi.mocked(generateJSON).mockRejectedValueOnce(
        new Error("AI generation timed out. Please try again."),
      );

      const request = new Request("http://localhost:3000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data.error).toBe("AI generation timed out. Please try again.");
      expect(data.budgetBreakdown).toBeUndefined();
      expect(data.timeline).toBeUndefined();
      expect(data.personalizedIdeas).toBeUndefined();
    });

    it("should return HTTP 429 when Gemini AI quota is exceeded (RateLimitError)", async () => {
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 7,
        reset: Date.now() + 60000,
      });

      const error = new Error("Gemini API quota exceeded. Please try again later.");
      error.name = "RateLimitError";
      vi.mocked(generateJSON).mockRejectedValueOnce(error);

      const request = new Request("http://localhost:3000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Gemini API quota exceeded. Please try again later.");
    });
  });
});
