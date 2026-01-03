import { DEFAULT_CURRENCIES } from './defaults';
import { CurrencySchema } from '../schemas/models.schema';

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

    it('should include AUD', () => {
      const aud = DEFAULT_CURRENCIES.find((c) => c.code === 'AUD');
      expect(aud).toBeDefined();
      expect(aud?.symbol).toBe('A$');
      expect(aud?.decimalPlaces).toBe(2);
    });
  });
});
