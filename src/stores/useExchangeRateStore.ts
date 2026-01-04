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

  getRateForMonth: (month, fromCurrency, toCurrency) => {
    const { rates } = get();
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // Same currency, rate is 1
    if (from === to) {
      return 1;
    }

    // Helper to get X->USD rate
    const getToUsdRate = (currency: string): number | null => {
      if (currency === 'USD') {
        return 1;
      }

      // Try to find exact X->USD rate for the month
      const exactRate = rates.find(
        (r) => r.month === month && r.fromCurrency === currency && r.toCurrency === 'USD'
      );

      if (exactRate) {
        return exactRate.rate;
      }

      // Try fallback to previous months
      return findFallbackRate(rates, month, currency, 'USD');
    };

    // If converting to USD, use direct method
    if (to === 'USD') {
      return getToUsdRate(from);
    }

    // If converting from USD, get inverse of target->USD rate
    if (from === 'USD') {
      const toUsdRate = getToUsdRate(to);
      return toUsdRate !== null ? 1 / toUsdRate : null;
    }

    // For X->Y, calculate through USD: X->USD / Y->USD
    const fromToUsd = getToUsdRate(from);
    const toToUsd = getToUsdRate(to);

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
    // Fetch them individually
    const fetchPromises: Promise<number | null>[] = [];

    // Fetch from->USD if not USD and not already present
    if (from !== 'USD') {
      const fromKey = getRateKey(month, from, 'USD');
      const existingFromRate = get().getRateForMonth(month, from, 'USD');

      if (existingFromRate === null && !loading[fromKey]) {
        const fallbackFromRate = findFallbackRate(rates, month, from, 'USD');
        if (fallbackFromRate === null) {
          // Mark as loading and fetch
          set((state) => ({
            loading: { ...state.loading, [fromKey]: true },
            errors: { ...state.errors, [fromKey]: '' },
          }));

          fetchPromises.push(
            fetchCurrentRate(from, 'USD')
              .then((rate) => {
                if (rate !== null) {
                  const newRate: ExchangeRate = {
                    id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    month,
                    fromCurrency: from,
                    toCurrency: 'USD',
                    rate,
                    createdAt: new Date().toISOString(),
                  };
                  get().addRate(newRate);
                  set((state) => ({
                    loading: { ...state.loading, [fromKey]: false },
                    errors: { ...state.errors, [fromKey]: '' },
                  }));
                  return rate;
                } else {
                  const error = `Failed to fetch rate for ${from}/USD in ${month}`;
                  set((state) => ({
                    loading: { ...state.loading, [fromKey]: false },
                    errors: { ...state.errors, [fromKey]: error },
                  }));
                  return null;
                }
              })
              .catch((error) => {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                set((state) => ({
                  loading: { ...state.loading, [fromKey]: false },
                  errors: { ...state.errors, [fromKey]: errorMessage },
                }));
                return null;
              })
          );
        }
      }
    }

    // Fetch to->USD if not USD and not already present
    if (to !== 'USD') {
      const toKey = getRateKey(month, to, 'USD');
      const existingToRate = get().getRateForMonth(month, to, 'USD');

      if (existingToRate === null && !loading[toKey]) {
        const fallbackToRate = findFallbackRate(rates, month, to, 'USD');
        if (fallbackToRate === null) {
          // Mark as loading and fetch
          set((state) => ({
            loading: { ...state.loading, [toKey]: true },
            errors: { ...state.errors, [toKey]: '' },
          }));

          fetchPromises.push(
            fetchCurrentRate(to, 'USD')
              .then((rate) => {
                if (rate !== null) {
                  const newRate: ExchangeRate = {
                    id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    month,
                    fromCurrency: to,
                    toCurrency: 'USD',
                    rate,
                    createdAt: new Date().toISOString(),
                  };
                  get().addRate(newRate);
                  set((state) => ({
                    loading: { ...state.loading, [toKey]: false },
                    errors: { ...state.errors, [toKey]: '' },
                  }));
                  return rate;
                } else {
                  const error = `Failed to fetch rate for ${to}/USD in ${month}`;
                  set((state) => ({
                    loading: { ...state.loading, [toKey]: false },
                    errors: { ...state.errors, [toKey]: error },
                  }));
                  return null;
                }
              })
              .catch((error) => {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                set((state) => ({
                  loading: { ...state.loading, [toKey]: false },
                  errors: { ...state.errors, [toKey]: errorMessage },
                }));
                return null;
              })
          );
        }
      }
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
