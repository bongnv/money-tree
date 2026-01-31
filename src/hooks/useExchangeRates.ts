/**
 * Custom hooks for ExchangeRate data access
 * Uses useLiveQuery for reactive database queries
 */
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useExchangeRateService } from './useServices';
import { ensureRatesForReport } from '@/utils/exchangeRate.utils';
import type { ExchangeRate } from '../types/models';
import type { CurrencyCode } from '@/types/enums';

/**
 * Get all exchange rates
 */
export function useExchangeRates(): ExchangeRate[] | undefined {
  const exchangeRateService = useExchangeRateService();
  return useLiveQuery(() => exchangeRateService.getAll());
}

/**
 * Ensure required exchange rates are loaded and return them as a map
 * Fetches missing rates, stores them in DB, and returns the complete rates map
 *
 * Filters out undefined/null currencies automatically for defensive programming.
 *
 * @param currencies Set of currencies that need conversion (undefined values are filtered out)
 * @param months Array of months in YYYY-MM format
 * @param baseCurrency Target currency for conversions
 * @returns Object with ratesMap, loading state, and error
 *   - ratesMap: undefined while loading, Map when ready (use both isLoading and ratesMap checks)
 *   - isLoading: true when fetching rates, false when complete (success or error)
 *   - error: null on success, Error object on failure
 */
export function useEnsureExchangeRates(
  currencies: Set<CurrencyCode> | undefined,
  months: string[],
  baseCurrency: CurrencyCode
): { ratesMap: Map<string, number> | undefined; isLoading: boolean; error: Error | null } {
  const [ratesMap, setRatesMap] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all existing rates once using useLiveQuery
  const allRates = useExchangeRates();

  useEffect(() => {
    // Wait for rates to load
    if (allRates === undefined) {
      // isLoading is already true from initial state, no need to set it again
      return;
    }

    // Filter out undefined currencies (defensive programming)
    const validCurrencies = new Set<CurrencyCode>();
    if (currencies) {
      currencies.forEach((currency) => {
        if (currency !== undefined && currency !== null) {
          validCurrencies.add(currency);
        }
      });
    }

    if (validCurrencies.size === 0) {
      // No currencies to load - immediately ready with empty map
      Promise.resolve().then(() => {
        setRatesMap(new Map());
        setIsLoading(false);
        setError(null);
      });
      return;
    }

    let cancelled = false;

    const loadRates = async () => {
      setIsLoading(true);
      setError(null);
      setRatesMap(new Map()); // Clear map while loading

      try {
        // Pass existing rates to avoid DB call inside ensureRatesForReport
        const loadedRatesMap = await ensureRatesForReport(
          validCurrencies,
          months,
          baseCurrency,
          allRates
        );

        if (!cancelled) {
          setRatesMap(loadedRatesMap);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading exchange rates:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setRatesMap(new Map());
          setIsLoading(false);
        }
      }
    };

    loadRates();

    return () => {
      cancelled = true;
    };
  }, [currencies, months, baseCurrency, allRates]);

  return { ratesMap, isLoading, error };
}
