"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    mediaQuery.removeEventListener("change", callback);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) {
    return storedTheme === "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Accessible ThemeToggle component
 * Uses useSyncExternalStore for zero hydration mismatch and zero cascading render warnings.
 * Synchronizes HTML root class with light/dark preference.
 */
export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:ring-offset-zinc-900"
    >
      {isDark ? (
        <Sun
          className="h-5 w-5 text-amber-400 transition-transform duration-200 hover:rotate-45"
          aria-hidden="true"
        />
      ) : (
        <Moon
          className="h-5 w-5 text-zinc-700 transition-transform duration-200 hover:-rotate-12"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
