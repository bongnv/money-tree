import { create } from 'zustand';
import type { ExchangeRate } from '../types/models';
import { useAppStore } from './useAppStore';
import { fetchCurrentRate, findFallbackRate } from '../services/exchangeRate.service';

interface ExchangeRateState {
  rates: ExchangeRate[];
  loading: Record<string, boolean>; // key: 'YYYY-MM-EUR-USD'
  errors: Record<string, string>; // key: 'YYYY-MM-EUR-USD'
}

interface ExchangeRateActions {
  setRates: (rates: ExchangeRate[]) => void;
  addRate: (rate: ExchangeRate) => void;
  // Get conversion rate between any two currencies through USD
  getRateForMonth: (month: string, fromCurrency: string, toCurrency: string) => number | null;
  // Fetch exchange rate if missing, handles any currency pair through USD
  fetchRateIfMissing: (
    month: string,
    fromCurrency: string,
    toCurrency: string
  ) => Promise<number | null>;
  resetRates: () => void;
}

/**
 * Generate a unique key for rate lookup
 */
function getRateKey(month: string, fromCurrency: string, toCurrency: string): string {
  return `${month}-${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()}`;
}

/**
 * Get exact X->USD rate for a specific month (no fallback)
 * @returns rate value, 1 for USD, or null if not found
 */
function getToUsdRate(rates: ExchangeRate[], month: string, currency: string): number | null {
  const curr = currency.toUpperCase();

  if (curr === 'USD') {
    return 1;
  }

  const exactRate = rates.find(
    (r) => r.month === month && r.fromCurrency === curr && r.toCurrency === 'USD'
  );

  return exactRate ? exactRate.rate : null;
}

/**
 * Fetch rate for a currency if missing (checks exact, fallback, then API)
 * @param month Month in YYYY-MM format
 * @param currency Currency code to fetch rate for
 * @param rates Current rates array
 * @param loading Current loading state
 * @param get Zustand get function
 * @param set Zustand set function
 * @returns Promise resolving to rate value or null
 */
async function fetchCurrencyRate(
  month: string,
  currency: string,
  rates: ExchangeRate[],
  loading: Record<string, boolean>,
  get: () => ExchangeRateState & ExchangeRateActions,
  set: (partial: Partial<ExchangeRateState>) => void
): Promise<number | null> {
  if (currency === 'USD') {
    return 1;
  }

  const key = getRateKey(month, currency, 'USD');

  // Check if exact rate exists
  const exactRate = getToUsdRate(rates, month, currency);
  if (exactRate !== null) {
    return exactRate;
  }

  // Try fallback to previous months
  const fallbackRate = findFallbackRate(rates, month, currency, 'USD');
  if (fallbackRate !== null) {
    // Store the fallback rate for this month to avoid repeated lookups
    const fallbackRateRecord: ExchangeRate = {
      id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      month,
      fromCurrency: currency,
      toCurrency: 'USD',
      rate: fallbackRate,
      createdAt: new Date().toISOString(),
    };
    get().addRate(fallbackRateRecord);
    return fallbackRate;
  }

  // If already loading, skip
  if (loading[key]) {
    return null;
  }

  // Mark as loading and fetch from API
  set({
    loading: { ...loading, [key]: true },
    errors: { ...get().errors, [key]: '' },
  });

  try {
    const rate = await fetchCurrentRate(currency, 'USD');

    if (rate !== null) {
      const newRate: ExchangeRate = {
        id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        month,
        fromCurrency: currency,
        toCurrency: 'USD',
        rate,
        createdAt: new Date().toISOString(),
      };
      get().addRate(newRate);

      set({
        loading: { ...get().loading, [key]: false },
        errors: { ...get().errors, [key]: '' },
      });
      return rate;
    } else {
      const error = `Failed to fetch rate for ${currency}/USD in ${month}`;
      set({
        loading: { ...get().loading, [key]: false },
        errors: { ...get().errors, [key]: error },
      });
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    set({
      loading: { ...get().loading, [key]: false },
      errors: { ...get().errors, [key]: errorMessage },
    });
    return null;
  }
}

export const useExchangeRateStore = create<ExchangeRateState & ExchangeRateActions>((set, get) => ({
  rates: [],
  loading: {},
  errors: {},

  setRates: (rates) => {
    set({ rates });
  },

  addRate: (rate) => {
    set((state) => {
      // Check if rate already exists for this month and currency pair
      const existingIndex = state.rates.findIndex(
        (r) =>
          r.month === rate.month &&
          r.fromCurrency === rate.fromCurrency &&
          r.toCurrency === rate.toCurrency
      );

      // If exists, update it; otherwise, add new rate
      if (existingIndex !== -1) {
        const updatedRates = [...state.rates];
        updatedRates[existingIndex] = rate;
        return { rates: updatedRates };
      } else {
        return { rates: [...state.rates, rate] };
      }
    });
    useAppStore.getState().setUnsavedChanges(true);
  },

  getRateForMonth: (month, fromCurrency, toCurrency) => {
    const { rates } = get();
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // Same currency, rate is 1
    if (from === to) {
      return 1;
    }

    // If converting to USD, get direct rate
    if (to === 'USD') {
      return getToUsdRate(rates, month, from);
    }

    // If converting from USD, get inverse of target->USD rate
    if (from === 'USD') {
      const toUsdRate = getToUsdRate(rates, month, to);
      return toUsdRate !== null ? 1 / toUsdRate : null;
    }

    // For X->Y, calculate through USD: X->USD / Y->USD
    const fromToUsd = getToUsdRate(rates, month, from);
    const toToUsd = getToUsdRate(rates, month, to);

    if (fromToUsd !== null && toToUsd !== null) {
      return fromToUsd / toToUsd;
    }

    return null;
  },

  fetchRateIfMissing: async (month, fromCurrency, toCurrency) => {
    const { rates, loading } = get();
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // Same currency doesn't need fetching
    if (from === to) {
      return 1;
    }

    // For X->Y conversions, we need both X->USD and Y->USD (unless one is USD)
    const fetchPromises: Promise<number | null>[] = [];

    // Fetch rates for both currencies if needed
    if (from !== 'USD') {
      fetchPromises.push(fetchCurrencyRate(month, from, rates, loading, get, set));
    }
    if (to !== 'USD') {
      fetchPromises.push(fetchCurrencyRate(month, to, rates, loading, get, set));
    }

    // Wait for all fetches to complete
    if (fetchPromises.length > 0) {
      await Promise.allSettled(fetchPromises);
    }

    // Return the converted rate
    return get().getRateForMonth(month, from, to);
  },

  resetRates: () => {
    set({ rates: [], loading: {}, errors: {} });
  },
}));
