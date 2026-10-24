/**
 * Central TypeScript Type Definitions for Utsav AI
 * Celebration & Event Planning Domain Models
 */

export type EventCategory =
  | "wedding"
  | "reception"
  | "sangeet"
  | "mehendi"
  | "haldi"
  | "birthday"
  | "anniversary"
  | "corporate"
  | "festival"
  | "puja"
  | "other";

export interface EventBudgetBreakdown {
  venue: number;
  catering: number;
  decor: number;
  entertainment: number;
  photography: number;
  miscellaneous: number;
  total: number;
}

export interface EventScheduleItem {
  time: string;
  activity: string;
  description: string;
  location?: string;
}

export interface CelebrationPlan {
  id: string;
  title: string;
  category: EventCategory;
  guestCount: number;
  targetBudget: number;
  city: string;
  themes: string[];
  schedule: EventScheduleItem[];
  budgetBreakdown: EventBudgetBreakdown;
  checklist: string[];
  vendorRecommendations: string[];
  createdAt: string;
}

export interface AIPlanningRequest {
  category: EventCategory;
  guestCount: number;
  budget: number;
  city: string;
  culturalPreferences?: string[];
  customNotes?: string;
}

export interface AIPlanningResponse {
  plan: CelebrationPlan;
  generatedAt: string;
  model: string;
}
