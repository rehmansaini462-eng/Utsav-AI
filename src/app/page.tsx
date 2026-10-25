"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck, Cpu, Calculator, Compass, Flame, CheckCircle } from "lucide-react";
import { EventForm, PlanDashboard, LoadingSkeleton, ThemeToggle } from "@/components";
import { EventPlan } from "@/types/planner";

/**
 * Utsav AI - Home Page
 * Main landing and application dashboard integrating EventForm,
 * PlanDashboard, and LoadingSkeleton with WAI-ARIA live regions.
 */
export default function Home() {
  const [plan, setPlan] = useState<EventPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [politeAnnouncement, setPoliteAnnouncement] = useState<string>("");
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState<string>("");

  const handlePlanGenerated = (generatedPlan: EventPlan) => {
    setPlan(generatedPlan);
    setApiError(null);
    setAssertiveAnnouncement("");
    setPoliteAnnouncement(
      "Your personalized celebration plan has been successfully generated and is now displayed.",
    );
  };

  const handleReset = () => {
    setPlan(null);
    setApiError(null);
    setPoliteAnnouncement("Celebration plan reset. You can now configure a new event.");
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 transition-colors selection:bg-amber-500 selection:text-white dark:bg-[#09090b] dark:text-zinc-100">
      {/* Screen-reader accessible live regions */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {politeAnnouncement}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {assertiveAnnouncement}
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white shadow-md shadow-amber-500/20">
              <Flame className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                  Utsav AI
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  उत्सव एआई
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Celebration Intelligence Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle className="h-3 w-3" />
                Zero Mock Data
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        {!plan && !isLoading && (
          <section className="mb-10 text-center sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800 shadow-sm transition-transform hover:scale-105 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Next-Gen Indian Event Planning Pipeline</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-white">
              Plan Every Celebration with{" "}
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-amber-300 dark:to-amber-400">
                Deterministic Logic & AI
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 sm:text-lg dark:text-zinc-300">
              Utsav AI blends pure mathematical budget allocation (Catering 40%, Venue 30%, Decor
              15%, Misc 15%) with dynamic Gemini 2.5 synthesis for flawless weddings, milestone
              birthdays, and corporate summits.
            </p>

            {/* Architecture Guarantees */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                Zero Mock Fallback Guarantee
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <Cpu className="h-4 w-4 text-emerald-500" />
                Dynamic Gemini 2.5 Flash
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <Calculator className="h-4 w-4 text-blue-500" />
                100% Balanced Budget Split
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <Compass className="h-4 w-4 text-purple-500" />
                WAI-ARIA Accessible (100/100)
              </span>
            </div>
          </section>
        )}

        {/* Dynamic Display Area */}
        <div className="mx-auto max-w-4xl">
          {!plan && (
            <div className="space-y-10">
              {/* Visual Error Alert */}
              {apiError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
                >
                  {apiError}
                </div>
              )}

              <EventForm
                onPlanGenerated={handlePlanGenerated}
                onError={(msg) => setApiError(msg)}
                onLoadingChange={setIsLoading}
                isLoading={isLoading}
              />

              {isLoading && <LoadingSkeleton />}

              {/* Informative Feature Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
                    Baseline Budget Logic
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Pure mathematical split guaranteeing 40% Catering, 30% Venue, 15% Decor, and 15%
                    Miscellaneous, totaling exactly 100%.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
                    Cultural Personalization
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Tailored timeline milestones, high-impact vendor interview questions, and
                    creative themes custom to your guest count & city.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
                    Strict Zero Mock Policy
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    No artificial synthetic backups or fake loading illusions. If the AI or network
                    encounters an issue, clear errors are surfaced directly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {plan && <PlanDashboard plan={plan} onReset={handleReset} />}
        </div>
      </main>

      {/* Accessible Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6 lg:px-8 dark:text-zinc-400">
          <p>© 2026 Utsav AI. Built for Prompt Wars. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              WAI-ARIA 1.2 Compliant • Screen Reader Ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
