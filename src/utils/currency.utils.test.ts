import {
  getCurrencyById,
  getCurrencyByCode,
  formatCurrency,
  parseCurrency,
  getAllCurrencies,
  isValidCurrencyAmount,
} from './currency.utils';
import { DEFAULT_CURRENCIES } from '../constants/defaults';

describe('currency.utils', () => {
  describe('getCurrencyById', () => {
    it('should return currency for valid id', () => {
      const currency = getCurrencyById('usd');
      expect(currency).toBeDefined();
      expect(currency?.code).toBe('USD');
    });

    it('should return undefined for invalid id', () => {
      const currency = getCurrencyById('invalid');
      expect(currency).toBeUndefined();
    });
  });

  describe('getCurrencyByCode', () => {
    it('should return currency for valid code', () => {
      const currency = getCurrencyByCode('USD');
      expect(currency).toBeDefined();
      expect(currency?.id).toBe('usd');
    });

    it('should return undefined for invalid code', () => {
      const currency = getCurrencyByCode('INVALID');
      expect(currency).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const currency = getCurrencyByCode('usd');
      expect(currency).toBeUndefined();
    });
  });

  describe('formatCurrency', () => {
    it('should format USD with symbol by default', () => {
      const formatted = formatCurrency(1234.56, 'usd');
      expect(formatted).toBe('$1234.56');
    });

    it('should format EUR with symbol', () => {
      const formatted = formatCurrency(1234.56, 'eur');
      expect(formatted).toBe('€1234.56');
    });

    it('should format JPY with 0 decimal places', () => {
      const formatted = formatCurrency(1234, 'jpy');
      expect(formatted).toBe('¥1234');
    });

    it('should format VND with 0 decimal places', () => {
      const formatted = formatCurrency(10000, 'vnd');
      expect(formatted).toBe('₫10000');
    });

    it('should format with symbol and code when both options enabled', () => {
      const formatted = formatCurrency(1234.56, 'usd', {
        showSymbol: true,
        showCode: true,
      });
      expect(formatted).toBe('$1234.56 USD');
    });

    it('should format with code only when showSymbol is false', () => {
      const formatted = formatCurrency(1234.56, 'usd', {
        showSymbol: false,
        showCode: true,
      });
      expect(formatted).toBe('1234.56 USD');
    });

    it('should format without symbol or code when both disabled', () => {
      const formatted = formatCurrency(1234.56, 'usd', {
        showSymbol: false,
        showCode: false,
      });
      expect(formatted).toBe('1234.56');
    });

    it('should handle unknown currency gracefully', () => {
      const formatted = formatCurrency(1234.56, 'unknown');
      expect(formatted).toBe('1234.56');
    });

    it('should round to correct decimal places', () => {
      const formatted = formatCurrency(1234.567, 'usd');
      expect(formatted).toBe('$1234.57');
    });

    it('should handle negative amounts', () => {
      const formatted = formatCurrency(-1234.56, 'usd');
      expect(formatted).toBe('$-1234.56');
    });

    it('should handle zero', () => {
      const formatted = formatCurrency(0, 'usd');
      expect(formatted).toBe('$0.00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency string with symbol', () => {
      const parsed = parseCurrency('$1234.56', 'usd');
      expect(parsed).toBe(1234.56);
    });

    it('should parse currency string without symbol', () => {
      const parsed = parseCurrency('1234.56', 'usd');
      expect(parsed).toBe(1234.56);
    });

    it('should parse with commas', () => {
      const parsed = parseCurrency('1,234.56', 'usd');
      expect(parsed).toBe(1234.56);
    });

    it('should parse negative amounts', () => {
      const parsed = parseCurrency('-$1234.56', 'usd');
      expect(parsed).toBe(-1234.56);
    });

    it('should return 0 for invalid input', () => {
      const parsed = parseCurrency('invalid', 'usd');
      expect(parsed).toBe(0);
    });

    it('should return 0 for empty string', () => {
      const parsed = parseCurrency('', 'usd');
      expect(parsed).toBe(0);
    });

    it('should round to currency decimal places', () => {
      const parsed = parseCurrency('1234.567', 'usd');
      expect(parsed).toBe(1234.57);
    });

    it('should handle JPY with 0 decimal places', () => {
      const parsed = parseCurrency('1234.56', 'jpy');
      expect(parsed).toBe(1235);
    });

    it('should handle unknown currency', () => {
      const parsed = parseCurrency('1234.56', 'unknown');
      expect(parsed).toBe(1234.56);
    });
  });

  describe('getAllCurrencies', () => {
    it('should return all default currencies', () => {
      const currencies = getAllCurrencies();
      expect(currencies).toEqual(DEFAULT_CURRENCIES);
      expect(currencies.length).toBeGreaterThan(0);
    });

    it('should return currencies with all required fields', () => {
      const currencies = getAllCurrencies();
      currencies.forEach((currency) => {
        expect(currency).toHaveProperty('id');
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('symbol');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('decimalPlaces');
      });
    });
  });

  describe('isValidCurrencyAmount', () => {
    it('should return true for valid amount with correct decimal places', () => {
      expect(isValidCurrencyAmount(1234.56, 'usd')).toBe(true);
    });

    it('should return true for whole numbers', () => {
      expect(isValidCurrencyAmount(1234, 'usd')).toBe(true);
    });

    it('should return false for too many decimal places', () => {
      expect(isValidCurrencyAmount(1234.567, 'usd')).toBe(false);
    });

    it('should return true for JPY with no decimal places', () => {
      expect(isValidCurrencyAmount(1234, 'jpy')).toBe(true);
    });

    it('should return false for JPY with decimal places', () => {
      expect(isValidCurrencyAmount(1234.5, 'jpy')).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(isValidCurrencyAmount(NaN, 'usd')).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isValidCurrencyAmount(Infinity, 'usd')).toBe(false);
    });

    it('should return false for unknown currency', () => {
      expect(isValidCurrencyAmount(1234.56, 'unknown')).toBe(false);
    });

    it('should return true for negative amounts', () => {
      expect(isValidCurrencyAmount(-1234.56, 'usd')).toBe(true);
    });

    it('should return true for zero', () => {
      expect(isValidCurrencyAmount(0, 'usd')).toBe(true);
    });

    it('should return true for single decimal place when two allowed', () => {
      expect(isValidCurrencyAmount(1234.5, 'usd')).toBe(true);
    });
  });
});
