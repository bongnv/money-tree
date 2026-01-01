import { DEFAULT_CURRENCIES } from '../constants/defaults';
import type { Currency } from '../types/models';

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
    return amount.toFixed(2);
  }

  const formattedAmount = amount.toFixed(currency.decimalPlaces);
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
export const isValidCurrencyAmount = (
  amount: number,
  currencyId: string
): boolean => {
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
