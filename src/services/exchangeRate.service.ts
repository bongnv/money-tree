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
 * Fetch monthly exchange rate from API
 * Uses exchangerate-api.io free tier (1,500 requests/month)
 * @param month Month in YYYY-MM format
 * @param fromCurrency Source currency code (e.g., 'EUR')
 * @param toCurrency Target currency code (e.g., 'USD')
 * @returns Exchange rate or null if unavailable
 */
export async function fetchMonthlyRate(
  _month: string,
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

    // Use exchangerate-api.io free tier API
    // Format: https://api.exchangerate-api.io/v4/latest/{fromCurrency}
    // Alternative format for better API: https://v6.exchangerate-api.com/v6/YOUR-API-KEY/latest/{fromCurrency}
    const apiUrl = `https://api.exchangerate-api.com/v4/latest/${fromCurrencyUpper}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`Exchange rate API returned ${response.status} for ${fromCurrencyUpper}`);
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

    const rate = rates[toCurrencyUpper];
    if (rate === undefined || rate === null) {
      console.error(`Rate not found for ${toCurrencyUpper}`);
      return null;
    }

    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

/**
 * Find fallback rate by searching previous months (up to 12 months back)
 * @param exchangeRates Array of existing exchange rates
 * @param month Month in YYYY-MM format
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Exchange rate or null if not found
 */
export function findFallbackRate(
  exchangeRates: Array<{ month: string; fromCurrency: string; toCurrency: string; rate: number }>,
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

    const rate = exchangeRates.find(
      (r) =>
        r.month === checkMonth && r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    );

    if (rate) {
      return rate.rate;
    }
  }

  return null;
}

/**
 * Get transaction month from date string
 * @param date Date string in YYYY-MM-DD format
 * @returns Month in YYYY-MM format
 */
export function getTransactionMonth(date: string): string {
  return date.substring(0, 7); // Extract YYYY-MM
}

/**
 * Get current month in YYYY-MM format
 * @returns Current month string
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get all months in a year
 * @param year Year number
 * @returns Array of month strings in YYYY-MM format
 */
export function getAllMonthsInYear(year: number): string[] {
  const months: string[] = [];
  for (let month = 1; month <= 12; month++) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
  }
  return months;
}
