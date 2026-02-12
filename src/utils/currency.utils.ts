import { DEFAULT_CURRENCIES } from '@/constants/defaults';
import type { CurrencyCode } from '@/types/enums';
import type { Currency } from '@/types/models';

/**
 * Get currency by code
 */
export const getCurrencyByCode = (code: string): Currency | undefined => {
  return DEFAULT_CURRENCIES.find((currency) => currency.code === code);
};

/**
 * Format amount with currency symbol and proper decimal places
 */
export const formatCurrency = (
  amount: number,
  currencyCode: CurrencyCode,
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
  }
): string => {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  });
  const showSymbol = options?.showSymbol !== false;
  const showCode = options?.showCode || false;

  if (showSymbol && showCode) {
    return `${currency.symbol}${formattedAmount} ${currency.code}`;
  } else if (showSymbol) {
    return `${currency.symbol}${formattedAmount}`;
  } else if (showCode) {
    return `${formattedAmount} ${currency.code}`;
  }

  return formattedAmount;
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string, currencyCode: CurrencyCode): number => {
  const currency = getCurrencyByCode(currencyCode);
  const cleanValue = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanValue);

  if (isNaN(parsed)) {
    return 0;
  }

  if (currency) {
    return parseFloat(parsed.toFixed(currency.decimalPlaces));
  }

  return parsed;
};

/**
 * Get all available currencies
 */
export const getAllCurrencies = (): Currency[] => {
  return DEFAULT_CURRENCIES;
};

/**
 * Validate currency amount
 */
export const isValidCurrencyAmount = (amount: number, currencyCode: CurrencyCode): boolean => {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) {
    return false;
  }

  if (!isFinite(amount) || isNaN(amount)) {
    return false;
  }

  const decimalPart = amount.toString().split('.')[1];
  if (decimalPart && decimalPart.length > currency.decimalPlaces) {
    return false;
  }

  return true;
};

/**
 * Convert amount from one currency to another
 */
export const convertAmount = (
  amount: number,
  fromCurrencyCode: CurrencyCode,
  toCurrencyCode: CurrencyCode,
  rate: number
): number => {
  // If same currency or rate is 1, no conversion needed
  if (fromCurrencyCode === toCurrencyCode || rate === 1) {
    return amount;
  }

  return amount * rate;
};

/**
 * Format currency with conversion details
 * Example: "€1,000 (≈ $1,180)"
 */
export const formatCurrencyWithConversion = (
  amount: number,
  currencyCode: CurrencyCode,
  convertedAmount?: number | null,
  baseCurrencyCode?: CurrencyCode,
  options?: {
    showOriginal?: boolean;
    showConverted?: boolean;
  }
): string => {
  const showOriginal = options?.showOriginal !== false;
  const showConverted = options?.showConverted !== false;

  // If no conversion or same currency, just format normally
  if (!convertedAmount || !baseCurrencyCode || currencyCode === baseCurrencyCode) {
    return formatCurrency(amount, currencyCode);
  }

  const originalFormatted = formatCurrency(amount, currencyCode);
  const convertedFormatted = formatCurrency(convertedAmount, baseCurrencyCode);

  if (showOriginal && showConverted) {
    return `${originalFormatted} (≈ ${convertedFormatted})`;
  } else if (showOriginal) {
    return originalFormatted;
  } else if (showConverted) {
    return convertedFormatted;
  }

  return originalFormatted;
};
