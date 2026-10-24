/**
 * ============================================================================
 * REAL ALGORITHMIC BUDGET LOGIC
 * ============================================================================
 * Pure mathematical budget allocation engine for Utsav AI.
 * Realistically splits celebratory budgets across core event pillars:
 * - Catering: 40%
 * - Venue: 30%
 * - Decor: 15%
 * - Miscellaneous: 15%
 *
 * Guarantees zero caching, exact mathematical consistency, and pure function determinism.
 */

export interface BaseBudgetAllocation {
  category: string;
  amount: number;
  percentage: number;
}

/**
 * Standard industry distribution percentages for celebration planning.
 */
export const BUDGET_DISTRIBUTION = [
  { category: "Catering", percentage: 40 },
  { category: "Venue", percentage: 30 },
  { category: "Decor", percentage: 15 },
  { category: "Miscellaneous", percentage: 15 },
] as const;

/**
 * Pure mathematical function that splits a given total budget according to the
 * realistic event breakdown ratios.
 *
 * @param totalBudget - Total available budget (must be non-negative)
 * @returns Array of category allocations with precise amounts and percentages
 * @throws Error if totalBudget is not a valid non-negative number
 */
export function calculateBaseBudget(totalBudget: number): BaseBudgetAllocation[] {
  if (typeof totalBudget !== "number" || Number.isNaN(totalBudget) || totalBudget < 0) {
    throw new Error("Total budget must be a non-negative number");
  }

  // Calculate base amounts rounded to 2 decimal places
  const allocations: BaseBudgetAllocation[] = BUDGET_DISTRIBUTION.map((item) => {
    const rawAmount = totalBudget * (item.percentage / 100);
    const amount = Math.round(rawAmount * 100) / 100;
    return {
      category: item.category,
      amount,
      percentage: item.percentage,
    };
  });

  // Reconcile any sub-cent rounding disparity to ensure exact mathematical balance
  const allocatedSum = allocations.reduce((sum, item) => sum + item.amount, 0);
  const diff = Math.round((totalBudget - allocatedSum) * 100) / 100;

  if (diff !== 0 && allocations.length > 0) {
    const lastItem = allocations[allocations.length - 1];
    if (lastItem) {
      lastItem.amount = Math.round((lastItem.amount + diff) * 100) / 100;
    }
  }

  return allocations;
}
