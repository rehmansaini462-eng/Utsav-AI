// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import Home from "@/app/page";
import { EventForm } from "@/components/planner/EventForm";
import { PlanDashboard } from "@/components/planner/PlanDashboard";
import { POST } from "@/app/api/generate-plan/route";
import { EventPlan } from "@/types/planner";

vi.mock("@/lib/utils/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60000,
  }),
}));

const mockDummyPlan: EventPlan = {
  budgetBreakdown: [
    { category: "Catering", amount: 40000, percentage: 40 },
    { category: "Venue", amount: 30000, percentage: 30 },
    { category: "Decor", amount: 15000, percentage: 15 },
    { category: "Miscellaneous", amount: 15000, percentage: 15 },
  ],
  timeline: [{ phase: "8 Weeks Before", tasks: ["Finalize venue", "Tasting session"] }],
  vendorChecklist: [{ vendorType: "Caterer", questionsToAsk: ["Live counters available?"] }],
  personalizedIdeas: ["Idea 1", "Idea 2", "Idea 3"],
};

describe("Task 3: Security & Accessibility Audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("1. Security Audit: Environment & Secret Leak Prevention", () => {
    it("should guarantee that .gitignore includes .env.local and all local env variants", () => {
      const gitignorePath = path.resolve(process.cwd(), ".gitignore");
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const content = fs.readFileSync(gitignorePath, "utf-8");
      expect(content).toContain(".env.local");
      expect(content).toContain(".env*.local");
    });

    it("should verify no sensitive server secrets are prefixed with NEXT_PUBLIC_", () => {
      const envExamplePath = path.resolve(process.cwd(), ".env.example");
      expect(fs.existsSync(envExamplePath)).toBe(true);

      const content = fs.readFileSync(envExamplePath, "utf-8");
      expect(content).not.toContain("NEXT_PUBLIC_GEMINI");
      expect(content).not.toContain("NEXT_PUBLIC_UPSTASH");
      expect(content).not.toContain("NEXT_PUBLIC_REDIS");
    });

    it("should verify client components do not import server env directly", () => {
      const componentsDir = path.resolve(process.cwd(), "src/components");
      const clientFiles: string[] = [];

      function scan(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scan(fullPath);
          } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
            clientFiles.push(fullPath);
          }
        }
      }

      scan(componentsDir);

      for (const file of clientFiles) {
        const fileContent = fs.readFileSync(file, "utf-8");
        expect(fileContent).not.toMatch(/from\s+["']@\/lib\/env["']/);
        expect(fileContent).not.toContain("process.env.GEMINI_API_KEY");
        expect(fileContent).not.toContain("process.env.UPSTASH_REDIS_REST_TOKEN");
      }
    });

    it("should verify public directory does not contain .env or credentials", () => {
      const publicDir = path.resolve(process.cwd(), "public");
      if (fs.existsSync(publicDir)) {
        const files = fs.readdirSync(publicDir);
        for (const file of files) {
          expect(file).not.toContain(".env");
          expect(file).not.toContain("secret");
          expect(file).not.toContain("key");
        }
      }
    });

    it("should verify /api/generate-plan error responses never leak secret keys", async () => {
      const sensitiveKeys = ["AIzaSy", "test_gemini_key", "test_token"];

      // Test with invalid JSON
      const badReq = new Request("http://localhost:3000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ bad json",
      });

      const response = await POST(badReq);
      const text = await response.text();

      for (const key of sensitiveKeys) {
        expect(text).not.toContain(key);
      }
    });
  });

  describe("2. Accessibility Audit: ARIA Roles, Keyboard Focus & Console Health", () => {
    it("should render Home page without any ARIA or accessibility console warnings", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<Home />);

      // Filter for any ARIA/accessibility specific warnings
      const ariaWarnings = warnSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === "string" && arg.toLowerCase().includes("aria")),
      );
      const ariaErrors = errorSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === "string" && arg.toLowerCase().includes("aria")),
      );

      expect(ariaWarnings).toHaveLength(0);
      expect(ariaErrors).toHaveLength(0);

      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it("should render PlanDashboard without any ARIA or accessibility console warnings", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<PlanDashboard plan={mockDummyPlan} />);

      const ariaWarnings = warnSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === "string" && arg.toLowerCase().includes("aria")),
      );
      const ariaErrors = errorSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === "string" && arg.toLowerCase().includes("aria")),
      );

      expect(ariaWarnings).toHaveLength(0);
      expect(ariaErrors).toHaveLength(0);

      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it("should verify all form interactive elements have proper accessible names and focus rings", () => {
      render(<EventForm onPlanGenerated={vi.fn()} />);

      const eventTypeSelect = screen.getByRole("combobox", { name: /Celebration Type/i });
      const budgetInput = screen.getByRole("spinbutton", {
        name: /Total budget in Indian Rupees/i,
      });
      const guestInput = screen.getByRole("spinbutton", { name: /Estimated number of guests/i });
      const locationInput = screen.getByRole("textbox", { name: /Event location or city/i });
      const submitButton = screen.getByRole("button", { name: /Generate Celebration Plan/i });

      // Focus class verification for visual focus indicators
      expect(eventTypeSelect.className).toContain("focus:ring-2");
      expect(budgetInput.className).toContain("focus:ring-2");
      expect(guestInput.className).toContain("focus:ring-2");
      expect(locationInput.className).toContain("focus:ring-2");
      expect(submitButton.className).toContain("focus:ring-2");
    });

    it("should verify tabs in PlanDashboard have full ARIA semantics and focus styles", () => {
      render(<PlanDashboard plan={mockDummyPlan} />);

      const tablist = screen.getByRole("tablist", { name: /Celebration Plan Sections/i });
      expect(tablist).toBeDefined();

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(4);

      for (const tab of tabs) {
        expect(tab.getAttribute("role")).toBe("tab");
        expect(tab.hasAttribute("aria-selected")).toBe(true);
        expect(tab.hasAttribute("aria-controls")).toBe(true);
        expect(tab.className).toContain("focus:ring-2");
      }

      const panel = screen.getByRole("tabpanel");
      expect(panel.hasAttribute("aria-labelledby")).toBe(true);
      expect(panel.getAttribute("tabIndex")).toBe("0");
    });
  });
});
