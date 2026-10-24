"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

/**
 * LoadingSkeleton Component
 * Accessible loading state displayed while Gemini 2.5 dynamically generates the plan.
 * Uses pulse animations, ARIA busy/status roles, and transparent transparency hints.
 */
export function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Synthesizing personalized celebration plan"
      className="w-full space-y-6"
    >
      {/* Header Banner Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <Sparkles className="h-3 w-3" />
                Live Gemini 2.5 Generation
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Strictly Dynamic • Zero Mock Data
              </span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Synthesizing Celebration Master Plan...
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Applying algorithmic budget rules (40/30/15/15) and tailoring vendor vetting questions
              to your preferences.
            </p>
          </div>
        </div>

        {/* Quick summary placeholders */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60"
            />
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-11 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60"
            />
          ))}
        </div>
      </div>

      {/* Main Body Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          <div className="h-6 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/60" />

          {/* Progress bar placeholder */}
          <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />

          {/* Table rows placeholders */}
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="flex h-12 items-center justify-between rounded-lg bg-zinc-50 px-4 dark:bg-zinc-800/40"
              >
                <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
