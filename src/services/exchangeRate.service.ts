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
 * Fetch current exchange rate from API
 * Uses exchangerate-api.io free tier (1,500 requests/month)
 * Note: This fetches the CURRENT rate only, not historical rates.
 * Historical rates from the data file should never be overwritten.
 * @param fromCurrency Source currency code (e.g., 'EUR')
 * @param toCurrency Target currency code (e.g., 'USD')
 * @returns Exchange rate or null if unavailable
 */
export async function fetchCurrentRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  try {
    // Normalize currency codes to uppercase (API returns uppercase)
    const fromCurrencyUpper = fromCurrency.toUpperCase();
    const toCurrencyUpper = toCurrency.toUpperCase();

    // If same currency, rate is always 1
    if (fromCurrencyUpper === toCurrencyUpper) {
      return 1;
    }

    // Try direct rate first
    const directRate = await fetchDirectRate(fromCurrencyUpper, toCurrencyUpper);
    if (directRate !== null) {
      return directRate;
    }

    // If direct rate fails and neither currency is USD, try USD as intermediate
    if (fromCurrencyUpper !== 'USD' && toCurrencyUpper !== 'USD') {
      console.log(
        `Direct rate not found for ${fromCurrencyUpper}/${toCurrencyUpper}, trying USD as intermediate`
      );

      // Try fromCurrency → USD → toCurrency
      const fromToUSD = await fetchDirectRate(fromCurrencyUpper, 'USD');
      const usdToTo = await fetchDirectRate('USD', toCurrencyUpper);

      if (fromToUSD !== null && usdToTo !== null) {
        const intermediateRate = fromToUSD * usdToTo;
        console.log(
          `Calculated intermediate rate via USD: ${fromCurrencyUpper} → USD (${fromToUSD}) → ${toCurrencyUpper} (${usdToTo}) = ${intermediateRate}`
        );
        return intermediateRate;
      }
    }

    console.error(
      `Failed to find rate for ${fromCurrencyUpper}/${toCurrencyUpper} (direct or via USD)`
    );
    return null;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

/**
 * Fetch direct exchange rate from API
 * @param fromCurrency Source currency code (uppercase)
 * @param toCurrency Target currency code (uppercase)
 * @returns Exchange rate or null if unavailable
 */
async function fetchDirectRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
  try {
    // Use exchangerate-api.io free tier API
    // Format: https://api.exchangerate-api.io/v4/latest/{fromCurrency}
    // Alternative format for better API: https://v6.exchangerate-api.com/v6/YOUR-API-KEY/latest/{fromCurrency}
    const apiUrl = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`Exchange rate API returned ${response.status} for ${fromCurrency}`);
      return null;
    }

    const data: ExchangeRateAPIResponse = await response.json();

    // Check for API errors
    if (data.error) {
      console.error(`Exchange rate API error: ${data.error}`);
      return null;
    }

    // Extract the rate for the target currency
    const rates = data.conversion_rates || data.rates;
    if (!rates) {
      console.error('No rates found in API response');
      return null;
    }

    const rate = rates[toCurrency];
    if (rate === undefined || rate === null) {
      return null;
    }

    return rate;
  } catch (error) {
    console.error('Error fetching direct exchange rate:', error);
    return null;
  }
}

import { useExchangeRateStore } from '../stores/useExchangeRateStore';
import type { ExchangeRate } from '../types/models';

/**
 * Find fallback rate by searching previous months (up to 12 months back)
 * @param exchangeRates Array of existing exchange rates
 * @param month Month in YYYY-MM format
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Exchange rate or null if not found
 */
function findFallbackRate(
  exchangeRates: ExchangeRate[],
  month: string,
  fromCurrency: string,
  toCurrency: string
): number | null {
  // If same currency, rate is always 1
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // Parse the target month
  const [targetYear, targetMonth] = month.split('-').map(Number);

  // Look for rates in previous months (up to 12 months back)
  for (let i = 1; i <= 12; i++) {
    const checkDate = new Date(targetYear, targetMonth - 1 - i, 1);
    const checkMonth = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;

    // Try exact match
    const rate = exchangeRates.find(
      (r) =>
        r.month === checkMonth && r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );

    if (rate) {
      return rate.rate;
    }

    // Try inverse rate
    const inverseRate = exchangeRates.find(
      (r) =>
        r.month === checkMonth && r.fromCurrency === toCurrency && r.toCurrency === fromCurrency
    );

    if (inverseRate) {
      return 1 / inverseRate.rate;
    }

    // Try through USD as intermediate
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromToUSD = exchangeRates.find(
        (r) => r.month === checkMonth && r.fromCurrency === fromCurrency && r.toCurrency === 'USD'
      );
      const usdToTo = exchangeRates.find(
        (r) => r.month === checkMonth && r.fromCurrency === 'USD' && r.toCurrency === toCurrency
      );

      if (fromToUSD && usdToTo) {
        return fromToUSD.rate * usdToTo.rate;
      }
    }
  }

  return null;
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
 * Fetch and store rate for a currency if missing (checks exact, fallback, then API)
 * @param month Month in YYYY-MM format
 * @param currency Currency code to fetch rate for
 * @returns Promise resolving to rate value or null
 */
async function ensureCurrencyRate(month: string, currency: string): Promise<number | null> {
  if (currency === 'USD') {
    return 1;
  }

  const store = useExchangeRateStore.getState();
  const rates = store.rates;

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
    store.addRate(fallbackRateRecord);
    return fallbackRate;
  }

  // Fetch from API
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
      store.addRate(newRate);
      return rate;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch rate for ${currency}/USD in ${month}:`, error);
    return null;
  }
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
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // Same currency doesn't need fetching
  if (from === to) {
    return 1;
  }

  // Check cache first
  const store = useExchangeRateStore.getState();
  const rates = store.rates;

  // If converting to USD, get direct rate
  if (to === 'USD') {
    const cachedRate = getToUsdRate(rates, month, from);
    if (cachedRate !== null) return cachedRate;
  }
  // If converting from USD, get inverse of target->USD rate
  else if (from === 'USD') {
    const toUsdRate = getToUsdRate(rates, month, to);
    if (toUsdRate !== null) return 1 / toUsdRate;
  }
  // For X->Y, calculate through USD: X->USD / Y->USD
  else {
    const fromToUsd = getToUsdRate(rates, month, from);
    const toToUsd = getToUsdRate(rates, month, to);
    if (fromToUsd !== null && toToUsd !== null) {
      return fromToUsd / toToUsd;
    }
  }

  // Rate not in cache, fetch it
  // For X->Y conversions, we need both X->USD and Y->USD (unless one is USD)
  const fetchPromises: Promise<number | null>[] = [];

  // Fetch rates for both currencies if needed
  if (from !== 'USD') {
    fetchPromises.push(ensureCurrencyRate(month, from));
  }
  if (to !== 'USD') {
    fetchPromises.push(ensureCurrencyRate(month, to));
  }

  // Wait for all fetches to complete
  if (fetchPromises.length > 0) {
    await Promise.allSettled(fetchPromises);
  }

  // Return the converted rate (recalculate from cache after fetching)
  const updatedRates = useExchangeRateStore.getState().rates;

  if (to === 'USD') {
    const rate = getToUsdRate(updatedRates, month, from);
    if (rate === null) {
      throw new Error(
        `Missing exchange rate for ${from} → ${to} in ${month}. Please fetch exchange rates in Settings → Exchange Rates.`
      );
    }
    return rate;
  } else if (from === 'USD') {
    const toUsdRate = getToUsdRate(updatedRates, month, to);
    if (toUsdRate === null) {
      throw new Error(
        `Missing exchange rate for ${from} → ${to} in ${month}. Please fetch exchange rates in Settings → Exchange Rates.`
      );
    }
    return 1 / toUsdRate;
  } else {
    const fromToUsd = getToUsdRate(updatedRates, month, from);
    const toToUsd = getToUsdRate(updatedRates, month, to);
    if (fromToUsd === null || toToUsd === null) {
      throw new Error(
        `Missing exchange rate for ${from} → ${to} in ${month}. Please fetch exchange rates in Settings → Exchange Rates.`
      );
    }
    return fromToUsd / toToUsd;
  }
}
