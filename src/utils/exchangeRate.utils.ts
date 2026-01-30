import { db } from '../db/database';
import { CurrencyCode } from '../types/enums';
import type { ExchangeRate } from '../types/models';

/**
 * Exchange Rate API Response format
 */
interface ExchangeRateAPIResponse {
  conversion_rates?: Record<string, number>;
  rates?: Record<string, number>;
  result?: string;
  error?: string;
}

/**
 * Fetch exchange rate from API
 * @param fromCurrency Source currency code (uppercase)
 * @returns Exchange rate to USD or throws error
 */
async function fetchRateFromAPI(fromCurrency: CurrencyCode): Promise<number> {
  const apiUrl = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`Exchange rate API returned ${response.status} for ${fromCurrency}`);
  }

  const data: ExchangeRateAPIResponse = await response.json();

  if (data.error) {
    throw new Error(`Exchange rate API error: ${data.error}`);
  }

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
 * Find fallback rate by searching nearest months (both past and future, up to 12 months)
 * @param month Month in YYYY-MM format
 * @param fromCurrency Source currency code
 * @returns Exchange rate value or null if not found
 */
async function findFallbackRate(month: string, fromCurrency: CurrencyCode): Promise<number | null> {
  if (fromCurrency === CurrencyCode.USD) {
    return 1;
  }

  const [targetYear, targetMonth] = month.split('-').map(Number);

  // Look for rates in nearest months (both directions, up to 12 months)
  for (let i = 1; i <= 12; i++) {
    // Check past month
    const pastDate = new Date(targetYear, targetMonth - 1 - i, 1);
    const pastMonth = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}`;

    const pastRate = await db.exchangeRates
      .where({ month: pastMonth, fromCurrency, toCurrency: CurrencyCode.USD })
      .first();

    if (pastRate) {
      return pastRate.rate;
    }

    // Check future month
    const futureDate = new Date(targetYear, targetMonth - 1 + i, 1);
    const futureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

    const futureRate = await db.exchangeRates
      .where({ month: futureMonth, fromCurrency, toCurrency: CurrencyCode.USD })
      .first();

    if (futureRate) {
      return futureRate.rate;
    }
  }

  return null;
}

/**
 * Get X->USD rate for a specific month
 * Checks cache, fallback, then fetches from API if needed
 * @param month Month in YYYY-MM format
 * @param currency Source currency
 * @returns Exchange rate to USD
 */
async function getToUsdRate(month: string, currency: CurrencyCode): Promise<number> {
  if (currency === CurrencyCode.USD) {
    return 1;
  }

  // Check cache first
  const exactRate = await db.exchangeRates
    .where({ month, fromCurrency: currency, toCurrency: CurrencyCode.USD })
    .first();

  if (exactRate) {
    return exactRate.rate;
  }

  // Try fallback to nearby months
  const fallbackRate = await findFallbackRate(month, currency);

  let rateValue: number;

  if (fallbackRate !== null) {
    rateValue = fallbackRate;
  } else {
    // Fetch from API as last resort
    try {
      rateValue = await fetchRateFromAPI(currency);
    } catch (error) {
      console.error(`Failed to fetch rate for ${currency}:`, error);
      throw new Error(`Unable to get exchange rate for ${currency} to USD`);
    }
  }

  // Cache the fetched/fallback rate
  const newRate: ExchangeRate = {
    id: `rate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    month,
    fromCurrency: currency,
    toCurrency: CurrencyCode.USD,
    rate: rateValue,
    createdAt: new Date().toISOString(),
  };

  await db.exchangeRates.add(newRate);

  return rateValue;
}

/**
 * Get exchange rate for a specific month and currency pair
 * Main entry point for getting exchange rates
 *
 * @param month Month in YYYY-MM format
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Exchange rate
 */
export async function getRateForMonth(
  month: string,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number> {
  // Same currency doesn't need conversion
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // If converting to USD, get direct rate
  if (toCurrency === CurrencyCode.USD) {
    return await getToUsdRate(month, fromCurrency);
  }
  // If converting from USD, get inverse of target->USD rate
  else if (fromCurrency === CurrencyCode.USD) {
    const rate = await getToUsdRate(month, toCurrency);
    return 1 / rate;
  }
  // For X->Y, calculate through USD: X->USD / Y->USD
  else {
    const fromToUsd = await getToUsdRate(month, fromCurrency);
    const toToUsd = await getToUsdRate(month, toCurrency);
    return fromToUsd / toToUsd;
  }
}
