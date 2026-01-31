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
 * @param preloadedRatesMap Pre-loaded rates map to check
 * @returns Exchange rate value or null if not found
 */
async function findFallbackRate(
  month: string,
  fromCurrency: CurrencyCode,
  preloadedRatesMap: Map<string, number>
): Promise<number | null> {
  if (fromCurrency === CurrencyCode.USD) {
    return 1;
  }

  const [targetYear, targetMonth] = month.split('-').map(Number);

  // Look for rates in nearest months (both directions, up to 12 months)
  for (let i = 1; i <= 12; i++) {
    // Check past month
    const pastDate = new Date(targetYear, targetMonth - 1 - i, 1);
    const pastMonth = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}`;

    const pastKey = `${pastMonth}_${fromCurrency}_${CurrencyCode.USD}`;
    const pastRate = preloadedRatesMap.get(pastKey);
    if (pastRate !== undefined) {
      return pastRate;
    }

    // Check future month
    const futureDate = new Date(targetYear, targetMonth - 1 + i, 1);
    const futureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

    const futureKey = `${futureMonth}_${fromCurrency}_${CurrencyCode.USD}`;
    const futureRate = preloadedRatesMap.get(futureKey);
    if (futureRate !== undefined) {
      return futureRate;
    }
  }

  return null;
}

/**
 * Get X->USD rate for a specific month
 * Checks cache, fallback, then fetches from API if needed
 * @param month Month in YYYY-MM format
 * @param currency Source currency
 * @param preloadedRatesMap Pre-loaded rates map to check
 * @returns Exchange rate to USD
 */
async function getToUsdRate(
  month: string,
  currency: CurrencyCode,
  preloadedRatesMap: Map<string, number>
): Promise<number> {
  if (currency === CurrencyCode.USD) {
    return 1;
  }

  // Check pre-loaded rates
  const rateKey = `${month}_${currency}_${CurrencyCode.USD}`;
  const preloadedRate = preloadedRatesMap.get(rateKey);
  if (preloadedRate !== undefined) {
    return preloadedRate;
  }

  // Try fallback to nearby months
  const fallbackRate = await findFallbackRate(month, currency, preloadedRatesMap);

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

  // Fetch all existing rates from DB once
  const allRates = await db.exchangeRates.toArray();
  const preloadedRatesMap = new Map<string, number>();
  for (const rate of allRates) {
    const key = `${rate.month}_${rate.fromCurrency}_${rate.toCurrency}`;
    preloadedRatesMap.set(key, rate.rate);
  }

  // If converting to USD, get direct rate
  if (toCurrency === CurrencyCode.USD) {
    return await getToUsdRate(month, fromCurrency, preloadedRatesMap);
  }
  // If converting from USD, get inverse of target->USD rate
  else if (fromCurrency === CurrencyCode.USD) {
    const rate = await getToUsdRate(month, toCurrency, preloadedRatesMap);
    return 1 / rate;
  }
  // For X->Y, calculate through USD: X->USD / Y->USD
  else {
    const fromToUsd = await getToUsdRate(month, fromCurrency, preloadedRatesMap);
    const toToUsd = await getToUsdRate(month, toCurrency, preloadedRatesMap);
    return fromToUsd / toToUsd;
  }
}

/**
 * Ensure all required exchange rates are loaded for a report
 * Pre-fetches missing rates to enable synchronous computation
 *
 * @param currencies Set of currencies that need conversion
 * @param months Array of months in YYYY-MM format
 * @param baseCurrency Target currency for conversions
 * @param preloadedRates Array of existing rates (required)
 * @returns Map of rates ready for synchronous lookup
 */
export async function ensureRatesForReport(
  currencies: Set<CurrencyCode>,
  months: string[],
  baseCurrency: CurrencyCode,
  preloadedRates: ExchangeRate[]
): Promise<Map<string, number>> {
  // Build map from provided rates
  const preloadedRatesMap = new Map<string, number>();
  for (const rate of preloadedRates) {
    const key = `${rate.month}_${rate.fromCurrency}_${rate.toCurrency}`;
    preloadedRatesMap.set(key, rate.rate);
  }

  const ratesMap = new Map<string, number>();

  // Fetch all required rates
  const fetchPromises: Promise<void>[] = [];

  for (const month of months) {
    for (const currency of currencies) {
      if (currency === baseCurrency || currency === CurrencyCode.USD) {
        continue; // No need to fetch for same currency or USD base
      }

      // Fetch X->USD rate (our storage format)
      const rateKey = `${month}_${currency}_${CurrencyCode.USD}`;
      const promise = getToUsdRate(month, currency, preloadedRatesMap).then((rate) => {
        ratesMap.set(rateKey, rate);
      });

      fetchPromises.push(promise);
    }

    // Also ensure baseCurrency->USD if not USD
    if (baseCurrency !== CurrencyCode.USD) {
      const rateKey = `${month}_${baseCurrency}_${CurrencyCode.USD}`;
      const promise = getToUsdRate(month, baseCurrency, preloadedRatesMap).then((rate) => {
        ratesMap.set(rateKey, rate);
      });
      fetchPromises.push(promise);
    }
  }

  // Fetch all rates concurrently
  await Promise.all(fetchPromises);

  return ratesMap;
}
