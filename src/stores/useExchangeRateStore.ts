import { create } from 'zustand';
import type { ExchangeRate } from '../types/models';
import { useAppStore } from './useAppStore';
import {
  fetchCurrentRate,
  findFallbackRate,
  getCurrentMonth,
} from '../services/exchangeRate.service';

interface ExchangeRateState {
  rates: ExchangeRate[];
  loading: Record<string, boolean>; // key: 'YYYY-MM-EUR-USD'
  errors: Record<string, string>; // key: 'YYYY-MM-EUR-USD'
}

interface MissingRate {
  month: string;
  fromCurrency: string;
  toCurrency: string;
}

interface ExchangeRateActions {
  setRates: (rates: ExchangeRate[]) => void;
  addRate: (rate: ExchangeRate) => void;
  updateRate: (id: string, updates: Partial<ExchangeRate>) => void;
  deleteRate: (id: string) => void;
  getRateForMonth: (month: string, fromCurrency: string, toCurrency: string) => number | null;
  fetchRateIfMissing: (
    month: string,
    fromCurrency: string,
    toCurrency: string
  ) => Promise<number | null>;
  fetchMissingRatesForYear: (year: number, currencyPairs: Array<[string, string]>) => Promise<void>;
  refreshRatesForYear: (year: number, currencyPairs: Array<[string, string]>) => Promise<void>;
  listMissingRates: (requiredRates: MissingRate[]) => MissingRate[];
  resetRates: () => void;
}

/**
 * Generate a unique key for rate lookup
 */
function getRateKey(month: string, fromCurrency: string, toCurrency: string): string {
  return `${month}-${fromCurrency}-${toCurrency}`;
}

export const useExchangeRateStore = create<ExchangeRateState & ExchangeRateActions>((set, get) => ({
  rates: [],
  loading: {},
  errors: {},

  setRates: (rates) => {
    set({ rates });
  },

  addRate: (rate) => {
    set((state) => ({
      rates: [...state.rates, rate],
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  updateRate: (id, updates) => {
    set((state) => ({
      rates: state.rates.map((rate) => (rate.id === id ? { ...rate, ...updates } : rate)),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  deleteRate: (id) => {
    set((state) => ({
      rates: state.rates.filter((rate) => rate.id !== id),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  getRateForMonth: (month, fromCurrency, toCurrency) => {
    const { rates } = get();

    // If same currency, rate is always 1
    if (fromCurrency === toCurrency) {
      return 1;
    }

    // Try to find exact rate for the month
    const exactRate = rates.find(
      (r) => r.month === month && r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );

    if (exactRate) {
      return exactRate.rate;
    }

    // Try fallback to previous months
    return findFallbackRate(rates, month, fromCurrency, toCurrency);
  },

  fetchRateIfMissing: async (month, fromCurrency, toCurrency) => {
    const { rates, loading } = get();
    const key = getRateKey(month, fromCurrency, toCurrency);

    // If already loading, return
    if (loading[key]) {
      return null;
    }

    // Check if rate already exists
    const existingRate = rates.find(
      (r) => r.month === month && r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );

    if (existingRate) {
      return existingRate.rate;
    }

    // Try to find nearest available rate first (saves API call)
    const fallbackRate = findFallbackRate(rates, month, fromCurrency, toCurrency);
    if (fallbackRate !== null) {
      // Store the fallback rate for this month to avoid future lookups
      const newRate: ExchangeRate = {
        id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        month,
        fromCurrency,
        toCurrency,
        rate: fallbackRate,
        createdAt: new Date().toISOString(),
      };
      get().addRate(newRate);
      
      // Clear any existing error for this rate
      set((state) => ({
        errors: { ...state.errors, [key]: '' },
      }));
      
      return fallbackRate;
    }

    // No fallback available, fetch from API
    // Set loading state
    set((state) => ({
      loading: { ...state.loading, [key]: true },
      errors: { ...state.errors, [key]: '' },
    }));

    try {
      const rate = await fetchCurrentRate(fromCurrency, toCurrency);

      if (rate === null) {
        const error = `Failed to fetch rate for ${fromCurrency}/${toCurrency} in ${month}`;
        set((state) => ({
          loading: { ...state.loading, [key]: false },
          errors: { ...state.errors, [key]: error },
        }));
        return null;
      }

      // Add the new rate
      const newRate: ExchangeRate = {
        id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        month,
        fromCurrency,
        toCurrency,
        rate,
        createdAt: new Date().toISOString(),
      };

      get().addRate(newRate);

      // Clear loading and error state
      set((state) => ({
        loading: { ...state.loading, [key]: false },
        errors: { ...state.errors, [key]: '' },
      }));

      return rate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set((state) => ({
        loading: { ...state.loading, [key]: false },
        errors: { ...state.errors, [key]: errorMessage },
      }));
      return null;
    }
  },

  fetchMissingRatesForYear: async (year, currencyPairs) => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      return `${year}-${month}`;
    });

    const fetchPromises: Promise<unknown>[] = [];

    for (const month of months) {
      for (const [fromCurrency, toCurrency] of currencyPairs) {
        const rate = get().getRateForMonth(month, fromCurrency, toCurrency);
        if (rate === null) {
          fetchPromises.push(get().fetchRateIfMissing(month, fromCurrency, toCurrency));
        }
      }
    }

    await Promise.allSettled(fetchPromises);
  },

  refreshRatesForYear: async (year, currencyPairs) => {
    // Don't update existing rates to save API calls
    // Only fetch rates that are truly missing
    const currentMonth = getCurrentMonth();
    const [currentYear] = currentMonth.split('-').map(Number);

    // If refreshing a year that's not current, do nothing (preserve historical data)
    if (year !== currentYear) {
      return;
    }

    const fetchPromises: Promise<unknown>[] = [];

    for (const [fromCurrency, toCurrency] of currencyPairs) {
      // Only fetch if rate doesn't exist - don't delete and refetch
      const existingRate = get().rates.find(
        (r) =>
          r.month === currentMonth && r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
      );
      if (!existingRate) {
        fetchPromises.push(get().fetchRateIfMissing(currentMonth, fromCurrency, toCurrency));
      }
    }

    await Promise.allSettled(fetchPromises);
  },

  listMissingRates: (requiredRates) => {
    const missing: MissingRate[] = [];

    for (const required of requiredRates) {
      const { month, fromCurrency, toCurrency } = required;

      // Skip if same currency
      if (fromCurrency === toCurrency) {
        continue;
      }

      // Check if rate exists
      const rate = get().getRateForMonth(month, fromCurrency, toCurrency);
      if (rate === null) {
        missing.push(required);
      }
    }

    return missing;
  },

  resetRates: () => {
    set({ rates: [], loading: {}, errors: {} });
  },
}));
