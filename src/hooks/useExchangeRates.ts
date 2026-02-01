/**
 * Custom hooks for ExchangeRate data access
 * Uses useLiveQuery for reactive database queries
 */
import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useExchangeRateService } from './useServices';
import { getCurrentMonth } from '@/utils/date.utils';
import { fetchRateFromAPI } from '@/utils/exchangeRate.utils';
import type { ExchangeRate } from '../types/models';
import { CurrencyCode } from '@/types/enums';

// Module-level fetching state shared across all hook instances
// Prevents duplicate API calls when multiple components use the hook
let isFetching = false;

/**
 * Get all exchange rates as an array
 * Used by settings page for displaying and managing rates
 * Automatically ensures current month rates are available for all supported currencies
 * Returns undefined while loading, empty array if no rates exist
 */
export function useExchangeRatesArray(): ExchangeRate[] | undefined {
  const exchangeRateService = useExchangeRateService();
  const rates = useLiveQuery(() => exchangeRateService.getAll());
  const currentMonth = getCurrentMonth();

  // Gather all supported currencies from enum
  const allCurrencies = useMemo(() => {
    return Object.values(CurrencyCode);
  }, []);

  // Ensure current month rates are available
  useEffect(() => {
    if (!rates || isFetching) {
      return;
    }

    let cancelled = false;

    const ensureCurrentMonthRates = async () => {
      // Build a map of existing rates for quick lookup
      const existingRatesMap = new Set<string>();
      for (const rate of rates) {
        if (rate.month === currentMonth) {
          const key = `${rate.fromCurrency}_${rate.toCurrency}`;
          existingRatesMap.add(key);
        }
      }

      // Check which rates are missing
      const missingRates: CurrencyCode[] = [];
      for (const currency of allCurrencies) {
        if (currency === CurrencyCode.USD) continue;

        const key = `${currency}_${CurrencyCode.USD}`;
        if (!existingRatesMap.has(key)) {
          missingRates.push(currency);
        }
      }

      if (missingRates.length === 0) {
        return;
      }

      // Fetch missing rates
      isFetching = true;

      try {
        for (const currency of missingRates) {
          if (cancelled) break;

          const rate = await fetchRateFromAPI(currency);

          const newRate: ExchangeRate = {
            id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            month: currentMonth,
            fromCurrency: currency,
            toCurrency: CurrencyCode.USD,
            rate,
            createdAt: new Date().toISOString(),
          };

          await exchangeRateService.create(newRate);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching exchange rates:', err);
        }
      } finally {
        if (!cancelled) {
          isFetching = false;
        }
      }
    };

    ensureCurrentMonthRates();

    return () => {
      cancelled = true;
    };
  }, [rates, allCurrencies, currentMonth, exchangeRateService]);

  return rates;
}

/**
 * Get all exchange rates as a map for efficient lookups
 * Map key format: "YYYY-MM_FROM_TO" -> rate
 * Returns undefined while loading, empty Map if no rates exist
 * Automatically ensures current month rates are available for all currencies in use
 */
export function useExchangeRates(): Map<string, number> | undefined {
  const rates = useExchangeRatesArray();

  return useMemo(() => {
    if (rates === undefined) return undefined;

    const ratesMap = new Map<string, number>();
    for (const rate of rates) {
      const key = `${rate.month}_${rate.fromCurrency}_${rate.toCurrency}`;
      ratesMap.set(key, rate.rate);
    }

    return ratesMap;
  }, [rates]);
}
