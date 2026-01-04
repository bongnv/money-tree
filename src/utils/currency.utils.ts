import { DEFAULT_CURRENCIES } from '../constants/defaults';
import type { Currency } from '../types/models';

/**
 * Compare two currency IDs case-insensitively
 * Handles null/undefined by returning false
 */
export const areCurrenciesEqual = (
  currency1: string | null | undefined,
  currency2: string | null | undefined
): boolean => {
  if (!currency1 || !currency2) return false;
  return currency1.toUpperCase() === currency2.toUpperCase();
};

/**
 * Get currency by ID
 */
export const getCurrencyById = (currencyId: string): Currency | undefined => {
  return DEFAULT_CURRENCIES.find((currency) => currency.id === currencyId);
};

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
  currencyId: string,
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
  }
): string => {
  const currency = getCurrencyById(currencyId);
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
export const parseCurrency = (value: string, currencyId: string): number => {
  const currency = getCurrencyById(currencyId);
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
export const isValidCurrencyAmount = (amount: number, currencyId: string): boolean => {
  const currency = getCurrencyById(currencyId);
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
  fromCurrencyId: string,
  toCurrencyId: string,
  rate: number
): number => {
  // If same currency or rate is 1, no conversion needed
  if (fromCurrencyId === toCurrencyId || rate === 1) {
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
  currencyId: string,
  convertedAmount?: number | null,
  baseCurrencyId?: string,
  options?: {
    showOriginal?: boolean;
    showConverted?: boolean;
  }
): string => {
  const showOriginal = options?.showOriginal !== false;
  const showConverted = options?.showConverted !== false;

  // If no conversion or same currency, just format normally
  if (!convertedAmount || !baseCurrencyId || currencyId === baseCurrencyId) {
    return formatCurrency(amount, currencyId);
  }

  const originalFormatted = formatCurrency(amount, currencyId);
  const convertedFormatted = formatCurrency(convertedAmount, baseCurrencyId);

  if (showOriginal && showConverted) {
    return `${originalFormatted} (≈ ${convertedFormatted})`;
  } else if (showOriginal) {
    return originalFormatted;
  } else if (showConverted) {
    return convertedFormatted;
  }

  return originalFormatted;
};
