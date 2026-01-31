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
 * @param currencies Set of currencies that need conversion
 * @param months Array of months in YYYY-MM format
 * @param baseCurrency Target currency for conversions
 * @returns Object with ratesMap, loading state, and error
 */
export function useEnsureExchangeRates(
  currencies: Set<CurrencyCode> | undefined,
  months: string[],
  baseCurrency: CurrencyCode
): { ratesMap: Map<string, number> | undefined; isLoading: boolean; error: Error | null } {
  const [ratesMap, setRatesMap] = useState<Map<string, number> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all existing rates once using useLiveQuery
  const allRates = useExchangeRates();

  useEffect(() => {
    if (!currencies || currencies.size === 0) {
      setRatesMap(new Map());
      return;
    }

    // Wait for rates to load
    if (allRates === undefined) {
      return;
    }

    let cancelled = false;

    const loadRates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Pass existing rates to avoid DB call inside ensureRatesForReport
        const loadedRatesMap = await ensureRatesForReport(
          currencies,
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
          setError(err instanceof Error ? err : new Error(String(err)));
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
