import { CurrencyCode } from '@/types/enums';
import { useExchangeRateStore } from '../stores/useExchangeRateStore';
import type { ExchangeRate } from '../types/models';

/**
 * Exchange Rate Service
 * Handles fetching exchange rates from external APIs
 */

export interface ExchangeRateAPIResponse {
  conversion_rates?: Record<string, number>;
  rates?: Record<string, number>;
  result?: string;
  error?: string;
}

/**
 * Fetch exchange rate from API
 * @param fromCurrency Source currency code (uppercase)
 * @param toCurrency Target currency code (uppercase)
 * @returns Exchange rate or null if unavailable
 */
async function fetchRateFromAPI(fromCurrency: CurrencyCode): Promise<number> {
  // Use exchangerate-api.io free tier API
  // Format: https://api.exchangerate-api.io/v4/latest/{fromCurrency}
  // Alternative format for better API: https://v6.exchangerate-api.com/v6/YOUR-API-KEY/latest/{fromCurrency}
  const apiUrl = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`Exchange rate API returned ${response.status} for ${fromCurrency}`);
  }

  const data: ExchangeRateAPIResponse = await response.json();

  // Check for API errors
  if (data.error) {
    throw new Error(`Exchange rate API error: ${data.error}`);
  }

  // Extract the rate for the target currency
  const rates = data.conversion_rates || data.rates;
  if (!rates) {
    throw new Error('No rates found in API response');
  }

  const rate = rates[CurrencyCode.USD];
  if (rate === undefined || rate === null) {
    throw new Error(`No rate found for USD in API response`);
  }

  return rate;
}

/**
 * Find fallback rate by searching nearest months (both past and future, up to 12 months in each direction)
 * @param exchangeRates Array of existing exchange rates
 * @param month Month in YYYY-MM format
 * @param fromCurrency Source currency code
 * @returns Exchange rate value
 */
async function findFallbackRateOrFetch(
  exchangeRates: ExchangeRate[],
  month: string,
  fromCurrency: CurrencyCode
): Promise<number> {
  // If same currency, rate is always 1
  if (fromCurrency === CurrencyCode.USD) {
    return 1;
  }

  // Parse the target month
  const [targetYear, targetMonth] = month.split('-').map(Number);

  // Look for rates in nearest months (both directions, up to 12 months)
  for (let i = 1; i <= 12; i++) {
    // Check past month
    const pastDate = new Date(targetYear, targetMonth - 1 - i, 1);
    const pastMonth = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}`;

    const pastRate = exchangeRates.find(
      (r) =>
        r.month === pastMonth &&
        r.fromCurrency === fromCurrency &&
        r.toCurrency === CurrencyCode.USD
    );

    if (pastRate) {
      return pastRate.rate;
    }

    // Check future month
    const futureDate = new Date(targetYear, targetMonth - 1 + i, 1);
    const futureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

    const futureRate = exchangeRates.find(
      (r) =>
        r.month === futureMonth &&
        r.fromCurrency === fromCurrency &&
        r.toCurrency === CurrencyCode.USD
    );

    if (futureRate) {
      return futureRate.rate;
    }
  }

  // Fetch from API
  return await fetchRateFromAPI(fromCurrency);
}

/**
 * Get exact X->USD rate for a specific month (no fallback)
 * @returns rate value, 1 for USD, or null if not found
 */
async function getToUsdRate(month: string, currency: CurrencyCode): Promise<number> {
  if (currency === CurrencyCode.USD) {
    return 1;
  }

  // Check cache first
  const store = useExchangeRateStore.getState();
  const rates = store.rates;

  const exactRate = rates.find(
    (r) => r.month === month && r.fromCurrency === currency && r.toCurrency === CurrencyCode.USD
  );

  if (exactRate) {
    return exactRate.rate;
  }

  // try fallback to previous months
  const fallbackRate = await findFallbackRateOrFetch(rates, month, currency);
  const newRate: ExchangeRate = {
    id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    month,
    fromCurrency: currency,
    toCurrency: CurrencyCode.USD,
    rate: fallbackRate,
    createdAt: new Date().toISOString(),
  };
  store.addRate(newRate);
  return fallbackRate;
}

/**
 * Get exchange rate for a specific month and currency pair
 * Checks cache first, then fallback, then fetches from API if needed
 * This is the main entry point for components to get exchange rates
 *
 * @param month Month in YYYY-MM format
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Promise resolving to exchange rate
 * @throws Error if exchange rate cannot be found
 */
export async function getRateForMonth(
  month: string,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number> {
  // Same currency doesn't need fetching
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // If converting to USD, get direct rate
  if (toCurrency === CurrencyCode.USD) {
    return await getToUsdRate(month, fromCurrency);
  }
  // If converting from USD, get inverse of target->USD rate
  else if (fromCurrency === CurrencyCode.USD) {
    return await getToUsdRate(month, toCurrency).then((rate) => 1 / rate);
  }
  // For X->Y, calculate through USD: X->USD / Y->USD
  else {
    const fromToUsd = await getToUsdRate(month, fromCurrency);
    const toToUsd = await getToUsdRate(month, toCurrency);
    return fromToUsd / toToUsd;
  }
}
