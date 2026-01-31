import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Generic filter state management hook
 * Handles active filters, selected values, and filter operations
 *
 * @template TFilters - The type of the filter object
 * @returns Filter state and handlers
 */
export function useFilterState<TFilters extends Record<string, any>>(initialFilters: TFilters) {
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<TFilters>(initialFilters);

  // Keep a ref to latest filters for applyFilters to use
  const filtersRef = useRef<TFilters>(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /**
   * Update a single filter value
   */
  const setFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Update multiple filters at once
   */
  const setMultipleFilters = useCallback((updates: Partial<TFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Apply the current filters (useful for "Apply" button patterns)
   */
  const applyFilters = useCallback(() => {
    setAppliedFilters(filtersRef.current);
  }, []);

  /**
   * Reset filters to initial state
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

  /**
   * Reset to initial but don't apply immediately
   */
  const resetToInitial = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  /**
   * Clear a single filter
   */
  const clearFilter = useCallback(
    <K extends keyof TFilters>(key: K) => {
      setFilters((prev) => ({ ...prev, [key]: initialFilters[key] }));
    },
    [initialFilters]
  );

  /**
   * Check if filters have been modified from initial state
   */
  const hasChanges = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(initialFilters);
  }, [filters, initialFilters]);

  /**
   * Check if filters have been applied and differ from initial
   */
  const hasActiveFilters = useMemo(() => {
    return JSON.stringify(appliedFilters) !== JSON.stringify(initialFilters);
  }, [appliedFilters, initialFilters]);

  /**
   * Check if current filters differ from applied filters
   */
  const hasUnappliedChanges = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(appliedFilters);
  }, [filters, appliedFilters]);

  return {
    // State
    filters,
    appliedFilters,

    // Computed
    hasChanges,
    hasActiveFilters,
    hasUnappliedChanges,

    // Actions
    setFilter,
    setMultipleFilters,
    applyFilters,
    resetFilters,
    resetToInitial,
    clearFilter,
  };
}
