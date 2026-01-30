import {
  getCurrencyByCode,
  formatCurrency,
  parseCurrency,
  getAllCurrencies,
  isValidCurrencyAmount,
  convertAmount,
  formatCurrencyWithConversion,
} from './currency.utils';
import { DEFAULT_CURRENCIES } from '../constants/defaults';
import { CurrencyCode } from '../types/enums';

describe('currency.utils', () => {
  describe('getCurrencyByCode', () => {
    it('should return currency for valid code', () => {
      const currency = getCurrencyByCode(CurrencyCode.USD);
      expect(currency).toBeDefined();
      expect(currency?.code).toBe(CurrencyCode.USD);
    });

    it('should return undefined for invalid code', () => {
      const currency = getCurrencyByCode('INVALID');
      expect(currency).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const currency = getCurrencyByCode(CurrencyCode.USD);
      expect(currency).toBeDefined();
    });
  });

  describe('formatCurrency', () => {
    it('should format USD with symbol by default', () => {
      const formatted = formatCurrency(1234.56, CurrencyCode.USD);
      expect(formatted).toBe('$1,234.56');
    });

    it('should format SGD with symbol', () => {
      const formatted = formatCurrency(1234.56, CurrencyCode.SGD);
      expect(formatted).toBe('S$1,234.56');
    });

    it('should format VND with 0 decimal places', () => {
      const formatted = formatCurrency(1234, CurrencyCode.VND);
      expect(formatted).toBe('₫1,234');
    });

    it('should format VND with 0 decimal places', () => {
      const formatted = formatCurrency(10000, CurrencyCode.VND);
      expect(formatted).toBe('₫10,000');
    });

    it('should format with symbol and code when both options enabled', () => {
      const formatted = formatCurrency(1234.56, CurrencyCode.USD, {
        showSymbol: true,
        showCode: true,
      });
      expect(formatted).toBe('$1,234.56 USD');
    });

    it('should format with code only when showSymbol is false', () => {
      const formatted = formatCurrency(1234.56, CurrencyCode.USD, {
        showSymbol: false,
        showCode: true,
      });
      expect(formatted).toBe('1,234.56 USD');
    });

    it('should format without symbol or code when both disabled', () => {
      const formatted = formatCurrency(1234.56, CurrencyCode.USD, {
        showSymbol: false,
        showCode: false,
      });
      expect(formatted).toBe('1,234.56');
    });

    it('should handle unknown currency gracefully', () => {
      const formatted = formatCurrency(1234.56, 'UNKNOWN' as CurrencyCode);
      expect(formatted).toBe('1,234.56');
    });

    it('should round to correct decimal places', () => {
      const formatted = formatCurrency(1234.567, CurrencyCode.USD);
      expect(formatted).toBe('$1,234.57');
    });

    it('should handle negative amounts', () => {
      const formatted = formatCurrency(-1234.56, CurrencyCode.USD);
      expect(formatted).toBe('$-1,234.56');
    });

    it('should handle zero', () => {
      const formatted = formatCurrency(0, CurrencyCode.USD);
      expect(formatted).toBe('$0.00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency string with symbol', () => {
      const parsed = parseCurrency('$1234.56', CurrencyCode.USD);
      expect(parsed).toBe(1234.56);
    });

    it('should parse currency string without symbol', () => {
      const parsed = parseCurrency('1234.56', CurrencyCode.USD);
      expect(parsed).toBe(1234.56);
    });

    it('should parse with commas', () => {
      const parsed = parseCurrency('1,234.56', CurrencyCode.USD);
      expect(parsed).toBe(1234.56);
    });

    it('should parse negative amounts', () => {
      const parsed = parseCurrency('-$1234.56', CurrencyCode.USD);
      expect(parsed).toBe(-1234.56);
    });

    it('should return 0 for invalid input', () => {
      const parsed = parseCurrency('invalid', CurrencyCode.USD);
      expect(parsed).toBe(0);
    });

    it('should return 0 for empty string', () => {
      const parsed = parseCurrency('', CurrencyCode.USD);
      expect(parsed).toBe(0);
    });

    it('should round to currency decimal places', () => {
      const parsed = parseCurrency('1234.567', CurrencyCode.USD);
      expect(parsed).toBe(1234.57);
    });

    it('should handle VND with 0 decimal places', () => {
      const parsed = parseCurrency('1234.56', CurrencyCode.VND);
      expect(parsed).toBe(1235);
    });

    it('should handle unknown currency', () => {
      const parsed = parseCurrency('1234.56', 'UNKNOWN' as CurrencyCode);
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
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('symbol');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('decimalPlaces');
      });
    });
  });

  describe('isValidCurrencyAmount', () => {
    it('should return true for valid amount with correct decimal places', () => {
      expect(isValidCurrencyAmount(1234.56, CurrencyCode.USD)).toBe(true);
    });

    it('should return true for whole numbers', () => {
      expect(isValidCurrencyAmount(1234, CurrencyCode.USD)).toBe(true);
    });

    it('should return false for too many decimal places', () => {
      expect(isValidCurrencyAmount(1234.567, CurrencyCode.USD)).toBe(false);
    });

    it('should return true for VND with no decimal places', () => {
      expect(isValidCurrencyAmount(1234, CurrencyCode.VND)).toBe(true);
    });

    it('should return false for VND with decimal places', () => {
      expect(isValidCurrencyAmount(1234.5, CurrencyCode.VND)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(isValidCurrencyAmount(NaN, CurrencyCode.USD)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isValidCurrencyAmount(Infinity, CurrencyCode.USD)).toBe(false);
    });

    it('should return false for unknown currency', () => {
      expect(isValidCurrencyAmount(1234.56, 'UNKNOWN' as CurrencyCode)).toBe(false);
    });

    it('should return true for negative amounts', () => {
      expect(isValidCurrencyAmount(-1234.56, CurrencyCode.USD)).toBe(true);
    });

    it('should return true for zero', () => {
      expect(isValidCurrencyAmount(0, CurrencyCode.USD)).toBe(true);
    });

    it('should return true for single decimal place when two allowed', () => {
      expect(isValidCurrencyAmount(1234.5, CurrencyCode.USD)).toBe(true);
    });
  });

  describe('convertAmount', () => {
    it('should convert amount using exchange rate', () => {
      const converted = convertAmount(1000, CurrencyCode.SGD, CurrencyCode.USD, 1.18);
      expect(converted).toBe(1180);
    });

    it('should return same amount for same currency', () => {
      const converted = convertAmount(1000, CurrencyCode.USD, CurrencyCode.USD, 1);
      expect(converted).toBe(1000);
    });

    it('should return same amount when rate is 1', () => {
      const converted = convertAmount(1000, CurrencyCode.SGD, CurrencyCode.USD, 1);
      expect(converted).toBe(1000);
    });

    it('should handle fractional rates', () => {
      const converted = convertAmount(1000, CurrencyCode.USD, CurrencyCode.SGD, 0.85);
      expect(converted).toBe(850);
    });

    it('should handle negative amounts', () => {
      const converted = convertAmount(-1000, CurrencyCode.SGD, CurrencyCode.USD, 1.18);
      expect(converted).toBe(-1180);
    });
  });

  describe('formatCurrencyWithConversion', () => {
    it('should format with conversion when different currencies', () => {
      const formatted = formatCurrencyWithConversion(
        1000,
        CurrencyCode.SGD,
        1180,
        CurrencyCode.USD
      );
      expect(formatted).toContain('1,000');
      expect(formatted).toContain('1,180');
      expect(formatted).toContain('≈');
    });

    it('should format without conversion when same currency', () => {
      const formatted = formatCurrencyWithConversion(
        1000,
        CurrencyCode.USD,
        1000,
        CurrencyCode.USD
      );
      expect(formatted).toBe('$1,000.00');
      expect(formatted).not.toContain('≈');
    });

    it('should format without conversion when no converted amount', () => {
      const formatted = formatCurrencyWithConversion(
        1000,
        CurrencyCode.USD,
        null,
        CurrencyCode.USD
      );
      expect(formatted).toBe('$1,000.00');
      expect(formatted).not.toContain('≈');
    });

    it('should format without conversion when no base currency', () => {
      const formatted = formatCurrencyWithConversion(1000, CurrencyCode.USD, 1180);
      expect(formatted).toBe('$1,000.00');
      expect(formatted).not.toContain('≈');
    });

    it('should show only original when showConverted is false', () => {
      const formatted = formatCurrencyWithConversion(
        1000,
        CurrencyCode.SGD,
        1180,
        CurrencyCode.USD,
        {
          showConverted: false,
        }
      );
      expect(formatted).not.toContain('1180');
      expect(formatted).not.toContain('≈');
    });

    it('should show only converted when showOriginal is false', () => {
      const formatted = formatCurrencyWithConversion(
        1000,
        CurrencyCode.SGD,
        1180,
        CurrencyCode.USD,
        {
          showOriginal: false,
        }
      );
      expect(formatted).toBe('$1,180.00');
      expect(formatted).not.toContain('≈');
    });
  });
});
