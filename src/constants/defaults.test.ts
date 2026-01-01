import { DEFAULT_CURRENCIES, DEFAULT_CATEGORIES } from './defaults';
import { CurrencySchema, CategorySchema } from '../schemas/models.schema';
import { Group } from '../types/enums';

describe('Default Data', () => {
  describe('DEFAULT_CURRENCIES', () => {
    it('should have at least one currency', () => {
      expect(DEFAULT_CURRENCIES.length).toBeGreaterThan(0);
    });

    it('should have unique currency IDs', () => {
      const ids = DEFAULT_CURRENCIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique currency codes', () => {
      const codes = DEFAULT_CURRENCIES.map((c) => c.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should all be valid according to CurrencySchema', () => {
      DEFAULT_CURRENCIES.forEach((currency) => {
        expect(() => CurrencySchema.parse(currency)).not.toThrow();
      });
    });

    it('should include USD', () => {
      const usd = DEFAULT_CURRENCIES.find((c) => c.code === 'USD');
      expect(usd).toBeDefined();
      expect(usd?.symbol).toBe('$');
      expect(usd?.decimalPlaces).toBe(2);
    });

    it('should include EUR', () => {
      const eur = DEFAULT_CURRENCIES.find((c) => c.code === 'EUR');
      expect(eur).toBeDefined();
      expect(eur?.symbol).toBe('€');
      expect(eur?.decimalPlaces).toBe(2);
    });

    it('should include JPY with 0 decimal places', () => {
      const jpy = DEFAULT_CURRENCIES.find((c) => c.code === 'JPY');
      expect(jpy).toBeDefined();
      expect(jpy?.decimalPlaces).toBe(0);
    });

    it('should include VND with 0 decimal places', () => {
      const vnd = DEFAULT_CURRENCIES.find((c) => c.code === 'VND');
      expect(vnd).toBeDefined();
      expect(vnd?.symbol).toBe('₫');
      expect(vnd?.decimalPlaces).toBe(0);
    });

    it('should include SGD', () => {
      const sgd = DEFAULT_CURRENCIES.find((c) => c.code === 'SGD');
      expect(sgd).toBeDefined();
      expect(sgd?.symbol).toBe('S$');
      expect(sgd?.decimalPlaces).toBe(2);
    });
  });

  describe('DEFAULT_CATEGORIES', () => {
    it('should have at least one category', () => {
      expect(DEFAULT_CATEGORIES.length).toBeGreaterThan(0);
    });

    it('should have unique category IDs', () => {
      const ids = DEFAULT_CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should all be valid according to CategorySchema', () => {
      DEFAULT_CATEGORIES.forEach((category) => {
        expect(() => CategorySchema.parse(category)).not.toThrow();
      });
    });

    it('should include income categories', () => {
      const incomeCategories = DEFAULT_CATEGORIES.filter((c) => c.group === Group.INCOME);
      expect(incomeCategories.length).toBeGreaterThan(0);
    });

    it('should include expense categories', () => {
      const expenseCategories = DEFAULT_CATEGORIES.filter((c) => c.group === Group.EXPENSE);
      expect(expenseCategories.length).toBeGreaterThan(0);
    });

    it('should include transfer category', () => {
      const transferCategories = DEFAULT_CATEGORIES.filter((c) => c.group === Group.TRANSFER);
      expect(transferCategories.length).toBeGreaterThan(0);
    });

    it('should include investment categories', () => {
      const investmentCategories = DEFAULT_CATEGORIES.filter(
        (c) => c.group === Group.INVESTMENT
      );
      expect(investmentCategories.length).toBeGreaterThan(0);
    });

    it('should have valid timestamps', () => {
      DEFAULT_CATEGORIES.forEach((category) => {
        expect(() => new Date(category.createdAt)).not.toThrow();
        expect(() => new Date(category.updatedAt)).not.toThrow();
        expect(new Date(category.createdAt).getTime()).not.toBeNaN();
        expect(new Date(category.updatedAt).getTime()).not.toBeNaN();
      });
    });

    it('should include common expense categories', () => {
      const categoryNames = DEFAULT_CATEGORIES.map((c) => c.name.toLowerCase());
      expect(categoryNames.some((name) => name.includes('food'))).toBe(true);
      expect(categoryNames.some((name) => name.includes('housing'))).toBe(true);
      expect(categoryNames.some((name) => name.includes('transportation'))).toBe(true);
    });
  });
});

