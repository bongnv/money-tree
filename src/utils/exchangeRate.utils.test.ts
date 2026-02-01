import { fetchRateFromAPI, getRateSync } from './exchangeRate.utils';
import { CurrencyCode } from '../types/enums';

// Mock fetch globally
global.fetch = jest.fn();

describe('exchangeRate.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchRateFromAPI', () => {
    it('should fetch exchange rate successfully with conversion_rates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversion_rates: {
            USD: 1.25,
            EUR: 1.1,
          },
        }),
      });

      const rate = await fetchRateFromAPI(CurrencyCode.USD);

      expect(global.fetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/USD');
      expect(rate).toBe(1.25);
    });

    it('should fetch exchange rate successfully with rates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          rates: {
            USD: 0.85,
            GBP: 0.75,
          },
        }),
      });

      const rate = await fetchRateFromAPI(CurrencyCode.SGD);

      expect(global.fetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/SGD');
      expect(rate).toBe(0.85);
    });

    it('should throw error when API returns non-ok status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchRateFromAPI(CurrencyCode.USD)).rejects.toThrow(
        'Exchange rate API returned 404 for USD'
      );
    });

    it('should throw error when API returns error in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'Invalid currency code',
        }),
      });

      await expect(fetchRateFromAPI(CurrencyCode.USD)).rejects.toThrow(
        'Exchange rate API error: Invalid currency code'
      );
    });

    it('should throw error when no rates in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(fetchRateFromAPI(CurrencyCode.USD)).rejects.toThrow(
        'No rates found in API response'
      );
    });

    it('should throw error when USD rate not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversion_rates: {
            EUR: 1.1,
            GBP: 1.25,
          },
        }),
      });

      await expect(fetchRateFromAPI(CurrencyCode.VND)).rejects.toThrow(
        'No rate found for USD in API response'
      );
    });

    it('should throw error when USD rate is null', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversion_rates: {
            USD: null,
          },
        }),
      });

      await expect(fetchRateFromAPI(CurrencyCode.SGD)).rejects.toThrow(
        'No rate found for USD in API response'
      );
    });
  });

  describe('getRateSync', () => {
    let ratesMap: Map<string, number>;

    beforeEach(() => {
      ratesMap = new Map();
      // Add some test rates
      ratesMap.set('2024-01_SGD_USD', 1.1);
      ratesMap.set('2024-01_AUD_USD', 1.25);
      ratesMap.set('2024-02_SGD_USD', 1.15);
      ratesMap.set('2024-02_AUD_USD', 1.27);
      ratesMap.set('2023-12_SGD_USD', 1.08);
    });

    it('should return 1 for same currency conversion', () => {
      const rate = getRateSync(ratesMap, '2024-01', CurrencyCode.USD, CurrencyCode.USD);
      expect(rate).toBe(1);
    });

    it('should get direct rate to USD', () => {
      const rate = getRateSync(ratesMap, '2024-01', CurrencyCode.SGD, CurrencyCode.USD);
      expect(rate).toBe(1.1);
    });

    it('should get inverse rate from USD', () => {
      const rate = getRateSync(ratesMap, '2024-01', CurrencyCode.USD, CurrencyCode.SGD);
      expect(rate).toBeCloseTo(1 / 1.1, 5);
    });

    it('should calculate rate through USD for X->Y conversion', () => {
      const rate = getRateSync(ratesMap, '2024-01', CurrencyCode.SGD, CurrencyCode.AUD);
      expect(rate).toBeCloseTo(1.1 / 1.25, 5);
    });

    it('should use exact month rate when available', () => {
      const rate = getRateSync(ratesMap, '2024-02', CurrencyCode.SGD, CurrencyCode.USD);
      expect(rate).toBe(1.15);
    });

    it('should fallback to past month when exact month not found', () => {
      const rate = getRateSync(ratesMap, '2024-03', CurrencyCode.SGD, CurrencyCode.USD);
      expect(rate).toBe(1.15); // Should use 2024-02
    });

    it('should fallback to future month when past not found', () => {
      const rate = getRateSync(ratesMap, '2023-11', CurrencyCode.SGD, CurrencyCode.USD);
      expect(rate).toBe(1.08); // Should use 2023-12
    });

    it('should search up to 12 months in both directions', () => {
      ratesMap.set('2024-12_SGD_USD', 1.2);

      const rate = getRateSync(ratesMap, '2024-06', CurrencyCode.SGD, CurrencyCode.USD);
      // Should find 2024-02 (4 months back) before 2024-12 (6 months forward)
      expect(rate).toBe(1.15);
    });

    it('should throw error when no rate found within 12 months', () => {
      const emptyMap = new Map<string, number>();

      expect(() => getRateSync(emptyMap, '2024-01', CurrencyCode.SGD, CurrencyCode.USD)).toThrow(
        'Exchange rate not found: 2024-01 SGD->USD'
      );
    });

    it('should throw error with helpful message', () => {
      const emptyMap = new Map<string, number>();

      expect(() => getRateSync(emptyMap, '2024-01', CurrencyCode.SGD, CurrencyCode.AUD)).toThrow(
        'No rate available within 12 months. Rates must be pre-loaded before calling getRateSync()'
      );
    });

    it('should handle USD as source currency', () => {
      const rate = getRateSync(ratesMap, '2024-01', CurrencyCode.USD, CurrencyCode.USD);
      expect(rate).toBe(1);
    });

    it('should handle month boundaries correctly', () => {
      ratesMap.set('2023-01_SGD_USD', 1.05);

      const rate = getRateSync(ratesMap, '2023-02', CurrencyCode.SGD, CurrencyCode.USD);
      expect(rate).toBe(1.05); // Should find 2023-01 (1 month back)
    });

    it('should handle year boundaries correctly', () => {
      ratesMap.set('2023-11_SGD_USD', 1.06);

      const rate = getRateSync(ratesMap, '2024-01', CurrencyCode.SGD, CurrencyCode.USD);
      expect(rate).toBe(1.1); // Should find exact match first
    });

    it('should prefer closer months when searching', () => {
      ratesMap.set('2024-05_SGD_USD', 1.18);
      ratesMap.set('2024-10_SGD_USD', 1.22);

      const rate = getRateSync(ratesMap, '2024-07', CurrencyCode.SGD, CurrencyCode.USD);
      expect(rate).toBe(1.18); // 2024-05 is 2 months back, 2024-10 is 3 months forward
    });

    it('should handle X->Y conversion with fallback months', () => {
      ratesMap.set('2024-05_SGD_USD', 1.18);
      ratesMap.set('2024-05_AUD_USD', 1.3);

      const rate = getRateSync(ratesMap, '2024-07', CurrencyCode.SGD, CurrencyCode.AUD);
      expect(rate).toBeCloseTo(1.18 / 1.3, 5);
    });

    it('should throw when one currency rate found but not the other for X->Y', () => {
      ratesMap.set('2024-05_SGD_USD', 1.18);
      // No VND rate available

      expect(() => getRateSync(ratesMap, '2024-07', CurrencyCode.SGD, CurrencyCode.VND)).toThrow(
        'Exchange rate not found'
      );
    });
  });
});
