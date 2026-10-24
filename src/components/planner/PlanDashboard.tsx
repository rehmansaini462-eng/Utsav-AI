"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import {
  PieChart,
  CalendarDays,
  Users2,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Printer,
  BadgePercent,
} from "lucide-react";
import { EventPlan } from "@/types/planner";

export interface PlanDashboardProps {
  plan: EventPlan;
  onReset?: () => void;
}

type TabType = "budget" | "timeline" | "vendors" | "ideas";

interface TabConfig {
  id: TabType;
  label: string;
  hindiLabel: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}

const TABS: TabConfig[] = [
  { id: "budget", label: "Budget", hindiLabel: "बजट", icon: PieChart },
  { id: "timeline", label: "Timeline", hindiLabel: "समयरेखा", icon: CalendarDays },
  { id: "vendors", label: "Vendors", hindiLabel: "विक्रेता", icon: Users2 },
  { id: "ideas", label: "Ideas", hindiLabel: "विचार", icon: Lightbulb },
];

/**
 * Category color theme helper for budget visualization
 */
function getCategoryColor(category: string): {
  bg: string;
  text: string;
  bar: string;
  badge: string;
} {
  const lower = category.toLowerCase();
  if (lower.includes("catering") || lower.includes("food")) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-300",
      bar: "bg-emerald-500",
      badge: "border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
    };
  }
  if (lower.includes("venue")) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-300",
      bar: "bg-amber-500",
      badge: "border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
    };
  }
  if (lower.includes("decor")) {
    return {
      bg: "bg-rose-50 dark:bg-rose-950/30",
      text: "text-rose-700 dark:text-rose-300",
      bar: "bg-rose-500",
      badge: "border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300",
    };
  }
  return {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    bar: "bg-blue-500",
    badge: "border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
  };
}

/**
 * PlanDashboard Component
 * WAI-ARIA compliant interactive dashboard for browsing generated celebration plans.
 * Implements accessible tablist navigation, keyboard arrow controls,
 * vertical timeline, vendor question checklists, and budget visualization.
 */
export function PlanDashboard({ plan, onReset }: PlanDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("budget");
  // Open vendor accordion indices
  const [openVendors, setOpenVendors] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Calculate total budget from items
  const totalBudget = plan.budgetBreakdown.reduce((sum, item) => sum + item.amount, 0);

  /**
   * Accessible Keyboard Navigation for Tabs (WAI-ARIA Tablist Pattern)
   * ArrowRight/ArrowDown: Next tab
   * ArrowLeft/ArrowUp: Previous tab
   * Home: First tab
   * End: Last tab
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        nextIndex = (currentIndex + 1) % TABS.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        event.preventDefault();
        nextIndex = TABS.length - 1;
        break;
      default:
        break;
    }

    if (nextIndex !== null) {
      const nextTab = TABS[nextIndex];
      if (nextTab) {
        setActiveTab(nextTab.id);
        tabRefs.current[nextIndex]?.focus();
      }
    }
  };

  const toggleVendor = (index: number) => {
    setOpenVendors((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-wider uppercase">
                Live Gemini 2.5 Plan
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              Celebration Master Plan (उत्सव मास्टर प्लान)
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Personalized roadmap built on deterministic allocations and dynamic cultural
              intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Print or save event plan"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus:ring-2 focus:ring-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>Print Plan</span>
            </button>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                aria-label="Plan another celebration"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-zinc-900"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>New Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Pill Row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Allocation</span>
            <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-white">
              ₹{totalBudget.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Budget Categories</span>
            <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-white">
              {plan.budgetBreakdown.length} Segments
            </p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Timeline Milestones</span>
            <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-white">
              {plan.timeline.length} Phases
            </p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Vetted Vendors</span>
            <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-white">
              {plan.vendorChecklist.length} Categories
            </p>
          </div>
        </div>
      </div>

      {/* Accessible Tab Navigation */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div
          role="tablist"
          aria-label="Celebration Plan Sections"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isSelected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                aria-label={`${tab.label} section`}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                  isSelected
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 dark:bg-amber-500 dark:text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
                <span className="hidden text-xs opacity-80 md:inline">({tab.hindiLabel})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}

      {/* 1. BUDGET TAB PANEL */}
      {activeTab === "budget" && (
        <section
          id="panel-budget"
          role="tabpanel"
          aria-labelledby="tab-budget"
          tabIndex={0}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-6 flex flex-col justify-between gap-2 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center dark:border-zinc-800">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Algorithmic Budget Allocation (बजट आवंटन)
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Calculated via baseline allocation algorithm (40% Catering, 30% Venue, 15% Decor,
                15% Misc).
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              <BadgePercent className="h-4 w-4" aria-hidden="true" />
              <span>100% Balanced</span>
            </div>
          </div>

          {/* Visual Progress Bar Breakdown */}
          <div className="mb-6">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              {plan.budgetBreakdown.map((item) => {
                const colors = getCategoryColor(item.category);
                return (
                  <div
                    key={item.category}
                    style={{ width: `${item.percentage}%` }}
                    className={`${colors.bar} transition-all duration-500`}
                    title={`${item.category}: ${item.percentage}%`}
                    aria-label={`${item.category} accounts for ${item.percentage}% of budget`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs">
              {plan.budgetBreakdown.map((item) => {
                const colors = getCategoryColor(item.category);
                return (
                  <div key={item.category} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${colors.bar}`} aria-hidden="true" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {item.category}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">({item.percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Semantic Accessible Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Budget Breakdown Table">
              <caption className="sr-only">
                Detailed allocation of event budget across categories
              </caption>
              <thead>
                <tr className="border-b border-zinc-200 text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:border-zinc-800 dark:text-zinc-400">
                  <th scope="col" className="py-3 pr-4">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Share (%)
                  </th>
                  <th scope="col" className="py-3 pl-4 text-right">
                    Allocated Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {plan.budgetBreakdown.map((item) => {
                  const colors = getCategoryColor(item.category);
                  return (
                    <tr
                      key={item.category}
                      className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${colors.badge}`}
                          >
                            {item.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        {item.percentage}%
                      </td>
                      <td className="py-4 pl-4 text-right font-mono text-base font-bold text-zinc-900 dark:text-white">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-200 font-semibold text-zinc-900 dark:border-zinc-700 dark:text-white">
                  <th scope="row" className="py-4 pr-4 text-base">
                    Total Allocated
                  </th>
                  <td className="px-4 py-4 text-center font-mono">100%</td>
                  <td className="py-4 pl-4 text-right font-mono text-lg font-extrabold text-amber-600 dark:text-amber-400">
                    ₹{totalBudget.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* 2. TIMELINE TAB PANEL */}
      {activeTab === "timeline" && (
        <section
          id="panel-timeline"
          role="tabpanel"
          aria-labelledby="tab-timeline"
          tabIndex={0}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-6 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Event Planning Timeline (आयोजन समयरेखा)
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Chronological milestones from early preparation to execution on the celebration day.
            </p>
          </div>

          <ol className="relative ml-4 space-y-8 border-l-2 border-amber-300 pl-6 dark:border-amber-700">
            {plan.timeline.map((phase, idx) => (
              <li key={phase.phase} className="relative">
                {/* Timeline Dot Marker */}
                <div
                  className="absolute top-0 -left-[35px] flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white ring-4 ring-white dark:ring-zinc-900"
                  aria-hidden="true"
                >
                  {idx + 1}
                </div>

                {/* Phase Content */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                    {phase.phase}
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {phase.tasks.map((task) => (
                      <li
                        key={task}
                        className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                          aria-hidden="true"
                        />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 3. VENDORS TAB PANEL */}
      {activeTab === "vendors" && (
        <section
          id="panel-vendors"
          role="tabpanel"
          aria-labelledby="tab-vendors"
          tabIndex={0}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-6 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Vendor Vetting Checklist & Interview Questions (विक्रेता प्रश्न सूची)
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              High-impact questions recommended by Gemini 2.5 to vet suppliers before signing
              contracts.
            </p>
          </div>

          <div className="space-y-4">
            {plan.vendorChecklist.map((item, idx) => {
              const isOpen = !!openVendors[idx];
              const accordionId = `vendor-accordion-${idx}`;
              const panelId = `vendor-panel-${idx}`;

              return (
                <div
                  key={item.vendorType}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/50 transition-colors dark:border-zinc-800 dark:bg-zinc-800/30"
                >
                  <button
                    type="button"
                    id={accordionId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleVendor(idx)}
                    className="flex w-full items-center justify-between rounded-xl p-4 text-left font-semibold text-zinc-900 focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {idx + 1}
                      </span>
                      <span className="text-base font-bold">{item.vendorType}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        ({item.questionsToAsk.length} questions)
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-zinc-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={accordionId}
                      className="border-t border-zinc-200 px-4 pt-3 pb-4 dark:border-zinc-800"
                    >
                      <h4 className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                        Questions to Ask This Vendor:
                      </h4>
                      <ul className="space-y-2">
                        {item.questionsToAsk.map((q) => (
                          <li
                            key={q}
                            className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300"
                          >
                            <HelpCircle
                              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                              aria-hidden="true"
                            />
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. IDEAS TAB PANEL */}
      {activeTab === "ideas" && (
        <section
          id="panel-ideas"
          role="tabpanel"
          aria-labelledby="tab-ideas"
          tabIndex={0}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-6 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Personalized & Cultural Ideas (अनूठे विचार एवं नवाचार)
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Innovative celebration concepts synthesized uniquely by Gemini 2.5 for your event
              theme.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {plan.personalizedIdeas.map((idea, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-sm transition-all hover:shadow-md dark:border-amber-900/40 dark:from-zinc-800/80 dark:to-zinc-900"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-white shadow-sm">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-400">
                      Suggestion #{idx + 1}
                    </span>
                    <p className="mt-1 text-sm leading-relaxed font-medium text-zinc-800 dark:text-zinc-200">
                      {idea}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
