// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventForm } from "@/components/planner/EventForm";
import { PlanDashboard } from "@/components/planner/PlanDashboard";
import { EventPlan } from "@/types/planner";

const mockDummyPlan: EventPlan = {
  budgetBreakdown: [
    { category: "Catering", amount: 40000, percentage: 40 },
    { category: "Venue", amount: 30000, percentage: 30 },
    { category: "Decor", amount: 15000, percentage: 15 },
    { category: "Miscellaneous", amount: 15000, percentage: 15 },
  ],
  timeline: [
    {
      phase: "8 Weeks Before",
      tasks: ["Finalize wedding venue in Jaipur", "Tasting session with caterers"],
    },
    {
      phase: "4 Weeks Before",
      tasks: ["Send royal digital invitations", "Finalize floral decor palette"],
    },
    {
      phase: "Event Day",
      tasks: ["Coordinate welcoming troupe", "Supervise banquet layout"],
    },
  ],
  vendorChecklist: [
    {
      vendorType: "Caterer",
      questionsToAsk: [
        "Do you provide authentic live Rajasthani counters?",
        "What is the staff-to-guest ratio?",
      ],
    },
    {
      vendorType: "Decorator",
      questionsToAsk: [
        "Are organic florals sourced locally?",
        "What is the setup timeline on the morning of the event?",
      ],
    },
  ],
  personalizedIdeas: [
    "Traditional flower shower welcoming with Shehnai melodies",
    "Live royal bangle-making artisan booth for interactive guest entertainment",
    "Curated miniature spice and attar gift boxes as guest souvenirs",
  ],
};

describe("Day 2: UI, Dashboard & Accessibility Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("1. EventForm Component & Accessibility", () => {
    it("should render all form controls with proper accessible labels and attributes", () => {
      render(<EventForm onPlanGenerated={vi.fn()} />);

      // Form header
      expect(screen.getByRole("heading", { name: /Design Your Celebration/i })).toBeDefined();

      // Controls with accessible names
      expect(screen.getByRole("combobox", { name: /Celebration Type/i })).toBeDefined();
      expect(
        screen.getByRole("spinbutton", { name: /Total budget in Indian Rupees/i }),
      ).toBeDefined();
      expect(screen.getByRole("spinbutton", { name: /Estimated number of guests/i })).toBeDefined();
      expect(screen.getByRole("textbox", { name: /Event location or city/i })).toBeDefined();
      expect(
        screen.getByRole("textbox", { name: /Custom preferences and cultural themes/i }),
      ).toBeDefined();

      // Submit button
      const submitButton = screen.getByRole("button", { name: /Generate Celebration Plan/i });
      expect(submitButton).toBeDefined();
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });

    it("should display validation error when budget is below 1000", async () => {
      const user = userEvent.setup();
      render(<EventForm onPlanGenerated={vi.fn()} />);

      const budgetInput = screen.getByRole("spinbutton", {
        name: /Total budget in Indian Rupees/i,
      });
      const submitButton = screen.getByRole("button", { name: /Generate Celebration Plan/i });

      // Clear budget and type an invalid value below 1000
      await user.clear(budgetInput);
      await user.type(budgetInput, "500");
      await user.click(submitButton);

      await waitFor(() => {
        const errorMsg = screen.getByText(/Budget must be at least 1000/i);
        expect(errorMsg).toBeDefined();
      });
    });

    it("should display validation error when location is empty or whitespace", async () => {
      const user = userEvent.setup();
      render(<EventForm onPlanGenerated={vi.fn()} />);

      const locationInput = screen.getByRole("textbox", { name: /Event location or city/i });
      const submitButton = screen.getByRole("button", { name: /Generate Celebration Plan/i });

      await user.clear(locationInput);
      await user.click(submitButton);

      await waitFor(() => {
        const errorMsg = screen.getByText(/Location is required and cannot be empty/i);
        expect(errorMsg).toBeDefined();
      });
    });

    it("should successfully submit valid form data to /api/generate-plan and trigger callback", async () => {
      const user = userEvent.setup();
      const onPlanGeneratedMock = vi.fn();

      // Mock successful fetch response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockDummyPlan }),
      } as Response);

      render(<EventForm onPlanGenerated={onPlanGeneratedMock} />);

      const submitButton = screen.getByRole("button", { name: /Generate Celebration Plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/generate-plan",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }),
        );
        expect(onPlanGeneratedMock).toHaveBeenCalledWith(mockDummyPlan);
      });
    });

    it("should handle HTTP 429 rate limiting gracefully with assertive error alert (Zero Mock Fallback)", async () => {
      const user = userEvent.setup();
      const onPlanGeneratedMock = vi.fn();
      const onErrorMock = vi.fn();

      // Mock HTTP 429 Rate limit response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "Rate limit exceeded. Please wait." }),
      } as Response);

      render(<EventForm onPlanGenerated={onPlanGeneratedMock} onError={onErrorMock} />);

      const submitButton = screen.getByRole("button", { name: /Generate Celebration Plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeDefined();
        expect(alert.textContent).toContain("Rate limit exceeded. Please wait.");
        // Crucial: Plan callback must NOT be called with synthetic data
        expect(onPlanGeneratedMock).not.toHaveBeenCalled();
        expect(onErrorMock).toHaveBeenCalledWith("Rate limit exceeded. Please wait.");
      });
    });

    it("should handle HTTP 500 AI failure gracefully with assertive error alert (Zero Mock Fallback)", async () => {
      const user = userEvent.setup();
      const onPlanGeneratedMock = vi.fn();
      const onErrorMock = vi.fn();

      // Mock HTTP 500 AI generation error
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "AI generation failed. Please try again." }),
      } as Response);

      render(<EventForm onPlanGenerated={onPlanGeneratedMock} onError={onErrorMock} />);

      const submitButton = screen.getByRole("button", { name: /Generate Celebration Plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeDefined();
        expect(alert.textContent).toContain("AI generation failed. Please try again.");
        expect(onPlanGeneratedMock).not.toHaveBeenCalled();
        expect(onErrorMock).toHaveBeenCalledWith("AI generation failed. Please try again.");
      });
    });

    it("should handle network TypeError gracefully with offline error message and reset loading state", async () => {
      const user = userEvent.setup();
      const onPlanGeneratedMock = vi.fn();
      const onErrorMock = vi.fn();

      // Mock fetch throwing TypeError (simulating offline mode)
      global.fetch = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));

      render(<EventForm onPlanGenerated={onPlanGeneratedMock} onError={onErrorMock} />);

      const submitButton = screen.getByRole("button", { name: /Generate Celebration Plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeDefined();
        expect(alert.textContent).toContain(
          "Network error. Please check your internet connection and try again.",
        );
        expect(onPlanGeneratedMock).not.toHaveBeenCalled();
        expect(onErrorMock).toHaveBeenCalledWith(
          "Network error. Please check your internet connection and try again.",
        );
      });

      // Loading state must be reset and button clickable again
      expect(submitButton.hasAttribute("disabled")).toBe(false);
    });
  });

  describe("2. PlanDashboard Component & Full WAI-ARIA Tab Accessibility", () => {
    it("should render tablist with all 4 tabs and correct initial ARIA states", () => {
      render(<PlanDashboard plan={mockDummyPlan} />);

      const tablist = screen.getByRole("tablist", { name: /Celebration Plan Sections/i });
      expect(tablist).toBeDefined();

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(4);

      const budgetTab = screen.getByRole("tab", { name: /Budget/i });
      const timelineTab = screen.getByRole("tab", { name: /Timeline/i });
      const vendorsTab = screen.getByRole("tab", { name: /Vendors/i });
      const ideasTab = screen.getByRole("tab", { name: /Ideas/i });

      // Initial active tab is Budget
      expect(budgetTab.getAttribute("aria-selected")).toBe("true");
      expect(timelineTab.getAttribute("aria-selected")).toBe("false");
      expect(vendorsTab.getAttribute("aria-selected")).toBe("false");
      expect(ideasTab.getAttribute("aria-selected")).toBe("false");

      // Corresponding tabpanel
      const budgetPanel = screen.getByRole("tabpanel");
      expect(budgetPanel.getAttribute("id")).toBe("panel-budget");
      expect(budgetPanel.getAttribute("aria-labelledby")).toBe("tab-budget");
    });

    it("should switch tabs on click and render corresponding panel content", async () => {
      const user = userEvent.setup();
      render(<PlanDashboard plan={mockDummyPlan} />);

      const timelineTab = screen.getByRole("tab", { name: /Timeline/i });
      await user.click(timelineTab);

      expect(timelineTab.getAttribute("aria-selected")).toBe("true");

      const timelinePanel = screen.getByRole("tabpanel");
      expect(timelinePanel.getAttribute("id")).toBe("panel-timeline");

      // Verify timeline content is visible
      expect(screen.getByText("8 Weeks Before")).toBeDefined();
      expect(screen.getByText("Finalize wedding venue in Jaipur")).toBeDefined();
    });

    it("should support keyboard arrow navigation (WAI-ARIA Tablist Pattern)", () => {
      render(<PlanDashboard plan={mockDummyPlan} />);

      const budgetTab = screen.getByRole("tab", { name: /Budget/i });
      budgetTab.focus();

      // Press ArrowRight to navigate to Timeline
      fireEvent.keyDown(budgetTab, { key: "ArrowRight" });
      const timelineTab = screen.getByRole("tab", { name: /Timeline/i });
      expect(timelineTab.getAttribute("aria-selected")).toBe("true");

      // Press ArrowRight to navigate to Vendors
      fireEvent.keyDown(timelineTab, { key: "ArrowRight" });
      const vendorsTab = screen.getByRole("tab", { name: /Vendors/i });
      expect(vendorsTab.getAttribute("aria-selected")).toBe("true");

      // Press ArrowRight to navigate to Ideas
      fireEvent.keyDown(vendorsTab, { key: "ArrowRight" });
      const ideasTab = screen.getByRole("tab", { name: /Ideas/i });
      expect(ideasTab.getAttribute("aria-selected")).toBe("true");

      // Wrap around with ArrowRight to Budget
      fireEvent.keyDown(ideasTab, { key: "ArrowRight" });
      expect(budgetTab.getAttribute("aria-selected")).toBe("true");

      // Wrap around with ArrowLeft to Ideas
      fireEvent.keyDown(budgetTab, { key: "ArrowLeft" });
      expect(ideasTab.getAttribute("aria-selected")).toBe("true");

      // Home key jumps to first tab (Budget)
      fireEvent.keyDown(ideasTab, { key: "Home" });
      expect(budgetTab.getAttribute("aria-selected")).toBe("true");

      // End key jumps to last tab (Ideas)
      fireEvent.keyDown(budgetTab, { key: "End" });
      expect(ideasTab.getAttribute("aria-selected")).toBe("true");
    });

    it("should render Budget tab table with category, percentage, and currency amounts", () => {
      render(<PlanDashboard plan={mockDummyPlan} />);

      const table = screen.getByRole("table", { name: /Budget Breakdown Table/i });
      expect(table).toBeDefined();

      const tableScope = within(table);

      // Check category rows inside table
      expect(tableScope.getByText("Catering")).toBeDefined();
      expect(tableScope.getByText("40%")).toBeDefined();
      expect(tableScope.getByText("₹40,000")).toBeDefined();

      expect(tableScope.getByText("Venue")).toBeDefined();
      expect(tableScope.getByText("30%")).toBeDefined();
      expect(tableScope.getByText("₹30,000")).toBeDefined();

      expect(tableScope.getByText("Decor")).toBeDefined();
      expect(tableScope.getAllByText("15%")).toHaveLength(2);
      expect(tableScope.getAllByText("₹15,000")).toHaveLength(2);

      expect(tableScope.getByText("Miscellaneous")).toBeDefined();

      // Total row
      expect(tableScope.getByText("Total Allocated")).toBeDefined();
      expect(tableScope.getByText("₹1,00,000")).toBeDefined();
    });

    it("should render Vendors tab with questions and accessible accordion toggles", async () => {
      const user = userEvent.setup();
      render(<PlanDashboard plan={mockDummyPlan} />);

      const vendorsTab = screen.getByRole("tab", { name: /Vendors/i });
      await user.click(vendorsTab);

      expect(screen.getByText("Caterer")).toBeDefined();
      expect(screen.getByText("Decorator")).toBeDefined();
      expect(screen.getByText("Do you provide authentic live Rajasthani counters?")).toBeDefined();

      // Accordion toggle button with aria-expanded
      const catererButton = screen.getByRole("button", { name: /Caterer/i });
      expect(catererButton.getAttribute("aria-expanded")).toBe("true");

      // Collapse accordion
      await user.click(catererButton);
      expect(catererButton.getAttribute("aria-expanded")).toBe("false");
    });

    it("should render Ideas tab with personalized AI recommendations", async () => {
      const user = userEvent.setup();
      render(<PlanDashboard plan={mockDummyPlan} />);

      const ideasTab = screen.getByRole("tab", { name: /Ideas/i });
      await user.click(ideasTab);

      expect(
        screen.getByText("Traditional flower shower welcoming with Shehnai melodies"),
      ).toBeDefined();
      expect(
        screen.getByText(
          "Live royal bangle-making artisan booth for interactive guest entertainment",
        ),
      ).toBeDefined();
      expect(
        screen.getByText("Curated miniature spice and attar gift boxes as guest souvenirs"),
      ).toBeDefined();
    });
  });
});
