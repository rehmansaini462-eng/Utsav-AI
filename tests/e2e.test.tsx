// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { EventPlan } from "@/types/planner";

const mockCelebrationPlan: EventPlan = {
  budgetBreakdown: [
    { category: "Catering", amount: 80000, percentage: 40 },
    { category: "Venue", amount: 60000, percentage: 30 },
    { category: "Decor", amount: 30000, percentage: 15 },
    { category: "Miscellaneous", amount: 30000, percentage: 15 },
  ],
  timeline: [
    {
      phase: "8 Weeks Before",
      tasks: ["Reserve heritage banquet lawn", "Catering tasting session"],
    },
    {
      phase: "4 Weeks Before",
      tasks: ["Send invitations", "Confirm floral themes"],
    },
    {
      phase: "Event Day",
      tasks: ["Coordinate welcoming party", "Stage lighting check"],
    },
  ],
  vendorChecklist: [
    {
      vendorType: "Caterer",
      questionsToAsk: [
        "Do you provide authentic live traditional counters?",
        "What is the staff-to-guest ratio?",
      ],
    },
    {
      vendorType: "Decorator",
      questionsToAsk: ["Are flowers sourced locally?", "What is the installation timeline?"],
    },
  ],
  personalizedIdeas: [
    "Traditional flower shower welcoming with Shehnai melodies",
    "Live royal artisan booth for interactive guest engagement",
    "Custom fragrance bar blending organic attars for souvenirs",
  ],
};

describe("End-to-End User Journeys (E2E Integration & Zero-Mock Policy)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // a) Happy Path: Fill form, submit, assert that the 40/30/15/15 budget table appears.
  it("a) Happy Path: fills form, submits, and verifies 40/30/15/15 balanced budget table appears", async () => {
    const user = userEvent.setup();

    // Mock successful 200 response from /api/generate-plan
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockCelebrationPlan,
      }),
    } as Response);

    render(<Home />);

    // 1. Verify initial landing UI elements
    expect(screen.getByRole("heading", { name: /Design Your Celebration/i })).toBeDefined();

    const budgetInput = screen.getByRole("spinbutton", {
      name: /Total budget in Indian Rupees/i,
    });
    const guestInput = screen.getByRole("spinbutton", {
      name: /Estimated number of guests/i,
    });
    const locationInput = screen.getByRole("textbox", {
      name: /Event location or city/i,
    });

    // 2. Fill form with custom event specifications
    await user.clear(budgetInput);
    await user.type(budgetInput, "200000");

    await user.clear(guestInput);
    await user.type(guestInput, "100");

    await user.clear(locationInput);
    await user.type(locationInput, "Udaipur, Rajasthan");

    // 3. Submit celebration plan request
    const submitButton = screen.getByRole("button", {
      name: /Generate Celebration Plan/i,
    });
    await user.click(submitButton);

    // 4. Assert fetch was dispatched to /api/generate-plan with proper payload
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/generate-plan",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"budget":200000'),
        }),
      );
    });

    // 5. Assert PlanDashboard is rendered with the 40/30/15/15 budget table
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Celebration Master Plan/i })).toBeDefined();
    });

    const budgetTable = screen.getByRole("table", { name: /Budget Breakdown Table/i });
    expect(budgetTable).toBeDefined();

    const tableScope = within(budgetTable);

    // Verify 40% Catering row
    expect(tableScope.getByText("Catering")).toBeDefined();
    expect(tableScope.getByText("40%")).toBeDefined();
    expect(tableScope.getByText("₹80,000")).toBeDefined();

    // Verify 30% Venue row
    expect(tableScope.getByText("Venue")).toBeDefined();
    expect(tableScope.getByText("30%")).toBeDefined();
    expect(tableScope.getByText("₹60,000")).toBeDefined();

    // Verify 15% Decor row
    expect(tableScope.getByText("Decor")).toBeDefined();
    expect(tableScope.getAllByText("15%")).toHaveLength(2);
    expect(tableScope.getAllByText("₹30,000")).toHaveLength(2);

    // Verify 15% Misc row
    expect(tableScope.getByText("Miscellaneous")).toBeDefined();

    // Verify 100% Total Allocated row
    expect(tableScope.getByText("Total Allocated")).toBeDefined();
    expect(tableScope.getByText("100%")).toBeDefined();
    expect(tableScope.getByText("₹2,00,000")).toBeDefined();
  });

  // b) Error Path 1: Invalid budget (<1000), assert form validation prevents submission.
  it("b) Error Path 1: rejects invalid budget (<1000) and blocks API submission with accessible validation message", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    render(<Home />);

    const budgetInput = screen.getByRole("spinbutton", {
      name: /Total budget in Indian Rupees/i,
    });
    const submitButton = screen.getByRole("button", {
      name: /Generate Celebration Plan/i,
    });

    // Enter an invalid budget under 1000
    await user.clear(budgetInput);
    await user.type(budgetInput, "750");
    await user.click(submitButton);

    // Form validation must block submission
    await waitFor(() => {
      const errorMsg = screen.getByText(/Budget must be at least 1000/i);
      expect(errorMsg).toBeDefined();
      expect(errorMsg.getAttribute("role")).toBe("alert");
    });

    // CRITICAL: fetch must NEVER have been called
    expect(fetchSpy).not.toHaveBeenCalled();

    // Dashboard must NOT be visible
    expect(screen.queryByRole("table", { name: /Budget Breakdown Table/i })).toBeNull();
  });

  // c) Error Path 2: Mock a 429 rate limit response, assert the UI shows the "Rate limit exceeded" alert and NO fake data is shown.
  it("c) Error Path 2: handles HTTP 429 Rate Limit response, displays alert, and guarantees NO fake data is displayed", async () => {
    const user = userEvent.setup();

    // Mock HTTP 429 Rate Limit
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: "Rate limit exceeded. Please wait.",
      }),
    } as Response);

    render(<Home />);

    const submitButton = screen.getByRole("button", {
      name: /Generate Celebration Plan/i,
    });
    await user.click(submitButton);

    // Assert the rate limit alert is surfaced
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeDefined();
      expect(alert.textContent).toContain("Rate limit exceeded. Please wait.");
    });

    // STRICT ZERO MOCK CHECK:
    // Assert no fake plan or dashboard data is rendered
    expect(screen.queryByRole("table", { name: /Budget Breakdown Table/i })).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByText(/Celebration Master Plan/i)).toBeNull();
  });

  // d) Error Path 3: Mock a 504 timeout response, assert UI shows the timeout error.
  it("d) Error Path 3: handles HTTP 504 Timeout response, displays timeout error alert, and enforces zero mock fallback", async () => {
    const user = userEvent.setup();

    // Mock HTTP 504 Gateway Timeout from API
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 504,
      json: async () => ({
        error: "AI generation timed out. Please try again.",
      }),
    } as Response);

    render(<Home />);

    const submitButton = screen.getByRole("button", {
      name: /Generate Celebration Plan/i,
    });
    await user.click(submitButton);

    // Assert the specific timeout error alert is displayed
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeDefined();
      expect(alert.textContent).toContain("AI generation timed out. Please try again.");
      expect(alert.textContent).toContain("Zero mock fallback policy is active");
    });

    // STRICT ZERO MOCK CHECK:
    // Verify absolutely no mock data is shown
    expect(screen.queryByRole("table", { name: /Budget Breakdown Table/i })).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByText(/Celebration Master Plan/i)).toBeNull();
  });
});
