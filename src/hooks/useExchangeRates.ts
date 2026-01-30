/**
 * Custom hooks for ExchangeRate data access
 * Uses useLiveQuery for reactive database queries
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { useExchangeRateService } from './useServices';
import type { ExchangeRate } from '../types/models';

/**
 * Get all exchange rates
 */
export function useExchangeRates(): ExchangeRate[] {
  const exchangeRateService = useExchangeRateService();
  return useLiveQuery(() => exchangeRateService.getAll()) ?? [];
}
