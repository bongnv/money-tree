import { CurrencyCode } from '@/types/enums';

/**
 * Synchronous exchange rate lookup from pre-loaded rates map
 * Throws error if rate not found (except same currency)
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

  // Direct conversion
  const directKey = `${month}_${fromCurrency}_${toCurrency}`;
  const directRate = ratesMap.get(directKey);
  if (directRate !== undefined) {
    return directRate;
  }

  // If converting to USD, try direct lookup
  if (toCurrency === CurrencyCode.USD) {
    const key = `${month}_${fromCurrency}_${CurrencyCode.USD}`;
    const rate = ratesMap.get(key);
    if (rate !== undefined) return rate;
  }

  // If converting from USD, get inverse
  if (fromCurrency === CurrencyCode.USD) {
    const key = `${month}_${toCurrency}_${CurrencyCode.USD}`;
    const rate = ratesMap.get(key);
    if (rate !== undefined) return 1 / rate;
  }

  // Cross-rate through USD: X->USD / Y->USD
  const fromToUsdKey = `${month}_${fromCurrency}_${CurrencyCode.USD}`;
  const toToUsdKey = `${month}_${toCurrency}_${CurrencyCode.USD}`;
  
  const fromToUsd = ratesMap.get(fromToUsdKey);
  const toToUsd = ratesMap.get(toToUsdKey);
  
  if (fromToUsd !== undefined && toToUsd !== undefined) {
    return fromToUsd / toToUsd;
  }

  // No rate found - throw error
  throw new Error(
    `Exchange rate not found: ${month} ${fromCurrency}->${toCurrency}. ` +
    `Ensure rates are pre-loaded with ensureRatesForReport().`
  );
}
