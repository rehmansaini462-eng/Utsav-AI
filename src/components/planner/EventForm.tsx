"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  IndianRupee,
  Users,
  MapPin,
  Calendar,
} from "lucide-react";
import { EventRequest, EventRequestSchema, EventPlan } from "@/types/planner";

export interface EventFormProps {
  onPlanGenerated: (plan: EventPlan) => void;
  onError?: (error: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  isLoading?: boolean;
}

/**
 * EventForm Component
 * Accessible client-side celebration planning form powered by react-hook-form
 * and Day 1 Zod validation schema. Strictly enforces Zero Mock Data policy.
 */
export function EventForm({
  onPlanGenerated,
  onError,
  onLoadingChange,
  isLoading: externalLoading = false,
}: EventFormProps) {
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isLoading = externalLoading || internalLoading;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EventRequest>({
    resolver: zodResolver(EventRequestSchema),
    defaultValues: {
      eventType: "wedding",
      budget: 500000,
      guestCount: 150,
      location: "Jaipur, Rajasthan",
      preferences:
        "Royal traditional heritage theme, live folk musicians, authentic vegetarian feast",
    },
  });

  const onSubmit = async (data: EventRequest) => {
    setApiError(null);
    setInternalLoading(true);
    onLoadingChange?.(true);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      let result: Partial<EventPlan> & { error?: string; data?: EventPlan } = {};
      try {
        result = await response.json();
      } catch {
        // Fallback if upstream proxy or server returned non-JSON payload
      }

      if (!response.ok) {
        let errorMsg = result.error;
        if (!errorMsg) {
          if (response.status === 429) {
            errorMsg = "Rate limit exceeded. Please wait a moment before trying again.";
          } else if (response.status === 504) {
            errorMsg = "AI generation timed out. Please try again.";
          } else if (response.status === 500) {
            errorMsg =
              "AI generation failed. Please try again. Zero mock fallback policy is strictly enforced.";
          } else {
            errorMsg = `Planning request failed with status ${response.status}.`;
          }
        }
        setApiError(errorMsg);
        onError?.(errorMsg);
        // CRITICAL: Strictly zero mock fallback on failure
        return;
      }

      // Successful dynamic plan received from Gemini 2.5
      const plan: EventPlan = (result.data || result) as EventPlan;
      onPlanGenerated(plan);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Network error. Failed to reach celebration planning server.";
      setApiError(msg);
      onError?.(msg);
    } finally {
      setInternalLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-amber-500/5 transition-all md:p-8 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-none">
      {/* Form Header */}
      <div className="mb-6 border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-wider uppercase">
            Algorithmic & AI Engine
          </span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Design Your Celebration (उत्सव योजना)
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Deterministic 40/30/15/15 budget logic combined with dynamic real-time Gemini 2.5
          intelligence.
        </p>
      </div>

      {/* API Error Alert (assertive live region for accessibility) */}
      {apiError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <div className="flex-1 text-sm">
            <h3 className="font-semibold">Unable to Generate Plan</h3>
            <p className="mt-0.5">{apiError}</p>
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">
              Zero mock fallback policy is active. Please adjust your request or retry shortly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            aria-label="Dismiss error message"
            className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Event Type Dropdown */}
        <div>
          <label
            htmlFor="eventType"
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >
            <Calendar className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Celebration Type (उत्सव का प्रकार){" "}
            <span className="text-amber-500" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="eventType"
            aria-label="Celebration Type"
            aria-required="true"
            aria-invalid={!!errors.eventType}
            aria-describedby={errors.eventType ? "eventType-error" : undefined}
            disabled={isLoading}
            {...register("eventType")}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-amber-400 dark:focus:ring-amber-400/20"
          >
            <option value="wedding">Wedding & Sangeet (विवाह एवं संगीत उत्सव)</option>
            <option value="birthday">Milestone Birthday (जन्मदिन समारोह)</option>
            <option value="corporate">Corporate Gala & Summit (कॉर्पोरेट समिट)</option>
          </select>
          {errors.eventType && (
            <p
              id="eventType-error"
              role="alert"
              className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {errors.eventType.message}
            </p>
          )}
        </div>

        {/* Budget and Guest Count Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Budget Input */}
          <div>
            <label
              htmlFor="budget"
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200"
            >
              <IndianRupee className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Total Budget (कुल बजट ₹){" "}
              <span className="text-amber-500" aria-hidden="true">
                *
              </span>
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-medium text-zinc-500 dark:text-zinc-400">
                ₹
              </span>
              <input
                id="budget"
                type="number"
                min="1000"
                step="1000"
                placeholder="500000"
                aria-label="Total budget in Indian Rupees"
                aria-required="true"
                aria-invalid={!!errors.budget}
                aria-describedby={errors.budget ? "budget-error" : "budget-help"}
                disabled={isLoading}
                {...register("budget", { valueAsNumber: true })}
                className="w-full rounded-xl border border-zinc-300 bg-white py-3 pr-4 pl-8 text-zinc-900 shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-amber-400 dark:focus:ring-amber-400/20"
              />
            </div>
            {errors.budget ? (
              <p
                id="budget-error"
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                {errors.budget.message?.includes("nan")
                  ? "Budget must be at least 1000"
                  : errors.budget.message}
              </p>
            ) : (
              <p id="budget-help" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Min. ₹1,000. Algorithmic breakdown: 40% Catering, 30% Venue, 15% Decor, 15% Misc.
              </p>
            )}

            {/* Quick Budget Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Budget quick presets">
              {[50000, 200000, 500000, 1500000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setValue("budget", amt, { shouldValidate: true })}
                  aria-label={`Set budget to ₹${amt.toLocaleString("en-IN")}`}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                >
                  ₹{amt / 100000 >= 1 ? `${amt / 100000} Lakh` : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Count Input */}
          <div>
            <label
              htmlFor="guestCount"
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200"
            >
              <Users className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Estimated Guests (अतिथि संख्या){" "}
              <span className="text-amber-500" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="guestCount"
              type="number"
              min="1"
              placeholder="150"
              aria-label="Estimated number of guests"
              aria-required="true"
              aria-invalid={!!errors.guestCount}
              aria-describedby={errors.guestCount ? "guestCount-error" : "guestCount-help"}
              disabled={isLoading}
              {...register("guestCount", { valueAsNumber: true })}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-amber-400 dark:focus:ring-amber-400/20"
            />
            {errors.guestCount ? (
              <p
                id="guestCount-error"
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                {errors.guestCount.message?.includes("nan")
                  ? "Guest count must be at least 1"
                  : errors.guestCount.message}
              </p>
            ) : (
              <p id="guestCount-help" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Minimum 1 guest. Used to calibrate catering volume and venue scale.
              </p>
            )}

            {/* Quick Guest Count Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Guest count quick presets">
              {[50, 150, 300, 500].map((count) => (
                <button
                  key={count}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setValue("guestCount", count, { shouldValidate: true })}
                  aria-label={`Set guest count to ${count}`}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                >
                  {count} Guests
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location Input */}
        <div>
          <label
            htmlFor="location"
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >
            <MapPin className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Celebration City or Destination (शहर / गंतव्य){" "}
            <span className="text-amber-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="location"
            type="text"
            placeholder="e.g. Jaipur, Rajasthan or Mumbai"
            aria-label="Event location or city"
            aria-required="true"
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? "location-error" : undefined}
            disabled={isLoading}
            {...register("location")}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-amber-400 dark:focus:ring-amber-400/20"
          />
          {errors.location && (
            <p
              id="location-error"
              role="alert"
              className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {errors.location.message}
            </p>
          )}

          {/* Quick City Presets */}
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="City quick presets">
            {["Jaipur", "Udaipur", "Goa", "Delhi NCR", "Mumbai", "Bengaluru"].map((city) => (
              <button
                key={city}
                type="button"
                disabled={isLoading}
                onClick={() => setValue("location", city, { shouldValidate: true })}
                aria-label={`Set location to ${city}`}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 focus:ring-1 focus:ring-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Preferences Textarea */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="preferences"
              className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Custom Preferences & Cultural Themes (प्राथमिकताएं एवं विचार)
            </label>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Optional</span>
          </div>
          <textarea
            id="preferences"
            rows={3}
            placeholder="e.g. Royal Rajasthani palace ambience, sunset poolside mehndi, live Sufi band, organic floral decor, vegetarian Rajasthani banquet..."
            aria-label="Custom preferences and cultural themes"
            disabled={isLoading}
            {...register("preferences")}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-amber-400 dark:focus:ring-amber-400/20"
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            aria-label={
              isLoading
                ? "Generating plan with Gemini AI, please wait"
                : "Generate Celebration Plan"
            }
            className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-6 py-4 font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-700 hover:via-amber-600 hover:to-amber-700 hover:shadow-amber-500/35 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-zinc-900"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>Generating Plan with Gemini 2.5...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span>Generate Celebration Plan (उत्सव योजना बनाएं)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
