import { CurrencyCode } from '../types/enums';

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
export async function fetchRateFromAPI(fromCurrency: CurrencyCode): Promise<number> {
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
 * Get X->USD rate with fallback to nearby months
 * Searches up to 12 months in both directions if exact month not found
 *
 * @param ratesMap Pre-loaded map of exchange rates
 * @param month Month in YYYY-MM format
 * @param currency Source currency code
 * @returns Exchange rate to USD or undefined if not found
 */
function getRateToUSDSync(
  ratesMap: Map<string, number>,
  month: string,
  currency: CurrencyCode
): number | undefined {
  if (currency === CurrencyCode.USD) {
    return 1;
  }

  // Try exact month first
  const exactKey = `${month}_${currency}_${CurrencyCode.USD}`;
  const exactRate = ratesMap.get(exactKey);
  if (exactRate !== undefined) {
    return exactRate;
  }

  // Fallback: search nearby months (up to 12 months in both directions)
  const [targetYear, targetMonth] = month.split('-').map(Number);

  for (let i = 1; i <= 12; i++) {
    // Check past month
    const pastDate = new Date(targetYear, targetMonth - 1 - i, 1);
    const pastMonth = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}`;
    const pastKey = `${pastMonth}_${currency}_${CurrencyCode.USD}`;
    const pastRate = ratesMap.get(pastKey);
    if (pastRate !== undefined) {
      return pastRate;
    }

    // Check future month
    const futureDate = new Date(targetYear, targetMonth - 1 + i, 1);
    const futureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
    const futureKey = `${futureMonth}_${currency}_${CurrencyCode.USD}`;
    const futureRate = ratesMap.get(futureKey);
    if (futureRate !== undefined) {
      return futureRate;
    }
  }

  return undefined;
}

/**
 * Synchronous exchange rate lookup from pre-loaded rates map
 * Falls back to nearby months (up to 12 months) if exact rate not found
 * Throws error only if no rate found within fallback range
 *
 * @param ratesMap Pre-loaded map of exchange rates
 * @param month Month in YYYY-MM format
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Exchange rate
 */
export function getRateSync(
  ratesMap: Map<string, number>,
  month: string,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  // Same currency doesn't need conversion
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // If converting to USD, get direct rate
  if (toCurrency === CurrencyCode.USD) {
    const rate = getRateToUSDSync(ratesMap, month, fromCurrency);
    if (rate !== undefined) return rate;
  }
  // If converting from USD, get inverse of target->USD rate
  else if (fromCurrency === CurrencyCode.USD) {
    const rate = getRateToUSDSync(ratesMap, month, toCurrency);
    if (rate !== undefined) return 1 / rate;
  }
  // For X->Y, calculate through USD: X->USD / Y->USD
  else {
    const fromToUsd = getRateToUSDSync(ratesMap, month, fromCurrency);
    const toToUsd = getRateToUSDSync(ratesMap, month, toCurrency);
    if (fromToUsd !== undefined && toToUsd !== undefined) {
      return fromToUsd / toToUsd;
    }
  }

  // No rate found - throw error
  throw new Error(
    `Exchange rate not found: ${month} ${fromCurrency}->${toCurrency}. ` +
      `No rate available within 12 months. Rates must be pre-loaded before calling getRateSync().`
  );
}
