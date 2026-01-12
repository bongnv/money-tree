import { getRateForMonth } from './exchangeRate.service';
import { CurrencyCode } from '@/types/enums';
import { useExchangeRateStore } from '../stores/useExchangeRateStore';
import type { ExchangeRate } from '../types/models';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the exchange rate store
jest.mock('../stores/useExchangeRateStore', () => ({
  useExchangeRateStore: {
    getState: jest.fn(),
  },
}));

describe('exchangeRate.service', () => {
  const mockGetState = useExchangeRateStore.getState as jest.Mock;
  let mockStore: { rates: ExchangeRate[]; addRate: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = {
      rates: [],
      addRate: jest.fn(),
    };
    mockGetState.mockReturnValue(mockStore);
    (global.fetch as jest.Mock).mockClear();
  });

  describe('getRateForMonth', () => {
    describe('same currency conversion', () => {
      it('should return 1 for same currency conversion', async () => {
        const rate = await getRateForMonth('2024-03', CurrencyCode.USD, CurrencyCode.USD);
        expect(rate).toBe(1);
      });

      it('should return 1 for VND to VND conversion', async () => {
        const rate = await getRateForMonth('2024-03', CurrencyCode.VND, CurrencyCode.VND);
        expect(rate).toBe(1);
      });
    });

    describe('USD conversion', () => {
      it('should return 1 for USD to USD', async () => {
        const rate = await getRateForMonth('2024-03', CurrencyCode.USD, CurrencyCode.USD);
        expect(rate).toBe(1);
      });
    });

    describe('exact rate found in cache', () => {
      it('should return cached rate for X->USD', async () => {
        const cachedRate: ExchangeRate = {
          id: 'rate-1',
          month: '2024-03',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.00004,
          createdAt: '2024-03-01T00:00:00.000Z',
        };
        mockStore.rates = [cachedRate];

        const rate = await getRateForMonth('2024-03', CurrencyCode.VND, CurrencyCode.USD);
        expect(rate).toBe(0.00004);
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should return inverse cached rate for USD->X', async () => {
        const cachedRate: ExchangeRate = {
          id: 'rate-1',
          month: '2024-03',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.74,
          createdAt: '2024-03-01T00:00:00.000Z',
        };
        mockStore.rates = [cachedRate];

        const rate = await getRateForMonth('2024-03', CurrencyCode.USD, CurrencyCode.SGD);
        expect(rate).toBeCloseTo(1 / 0.74, 10);
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should calculate X->Y through USD using cached rates', async () => {
        const sgdToUsd: ExchangeRate = {
          id: 'rate-1',
          month: '2024-03',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.74,
          createdAt: '2024-03-01T00:00:00.000Z',
        };
        const audToUsd: ExchangeRate = {
          id: 'rate-2',
          month: '2024-03',
          fromCurrency: CurrencyCode.AUD,
          toCurrency: CurrencyCode.USD,
          rate: 0.65,
          createdAt: '2024-03-01T00:00:00.000Z',
        };
        mockStore.rates = [sgdToUsd, audToUsd];

        const rate = await getRateForMonth('2024-03', CurrencyCode.SGD, CurrencyCode.AUD);
        expect(rate).toBeCloseTo(0.74 / 0.65, 10);
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    describe('fallback to nearest month', () => {
      it('should find rate from previous month', async () => {
        const pastRate: ExchangeRate = {
          id: 'rate-1',
          month: '2024-02',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.74,
          createdAt: '2024-02-01T00:00:00.000Z',
        };
        mockStore.rates = [pastRate];

        const rate = await getRateForMonth('2024-03', CurrencyCode.SGD, CurrencyCode.USD);
        expect(rate).toBe(0.74);
        expect(mockStore.addRate).toHaveBeenCalledWith(
          expect.objectContaining({
            month: '2024-03',
            fromCurrency: CurrencyCode.SGD,
            toCurrency: CurrencyCode.USD,
            rate: 0.74,
          })
        );
      });

      it('should find rate from future month', async () => {
        const futureRate: ExchangeRate = {
          id: 'rate-1',
          month: '2024-04',
          fromCurrency: CurrencyCode.AUD,
          toCurrency: CurrencyCode.USD,
          rate: 0.66,
          createdAt: '2024-04-01T00:00:00.000Z',
        };
        mockStore.rates = [futureRate];

        const rate = await getRateForMonth('2024-03', CurrencyCode.AUD, CurrencyCode.USD);
        expect(rate).toBe(0.66);
        expect(mockStore.addRate).toHaveBeenCalledWith(
          expect.objectContaining({
            month: '2024-03',
            fromCurrency: CurrencyCode.AUD,
            toCurrency: CurrencyCode.USD,
            rate: 0.66,
          })
        );
      });

      it('should prefer past month over future month when both are 1 month away', async () => {
        const pastRate: ExchangeRate = {
          id: 'rate-1',
          month: '2024-02',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.00004,
          createdAt: '2024-02-01T00:00:00.000Z',
        };
        const futureRate: ExchangeRate = {
          id: 'rate-2',
          month: '2024-04',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.000041,
          createdAt: '2024-04-01T00:00:00.000Z',
        };
        mockStore.rates = [pastRate, futureRate];

        const rate = await getRateForMonth('2024-03', CurrencyCode.VND, CurrencyCode.USD);
        expect(rate).toBe(0.00004); // Should prefer past month (checked first)
      });

      it('should find nearest rate - 2 months past vs 3 months future', async () => {
        const pastRate: ExchangeRate = {
          id: 'rate-1',
          month: '2024-01',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.73,
          createdAt: '2024-01-01T00:00:00.000Z',
        };
        const futureRate: ExchangeRate = {
          id: 'rate-2',
          month: '2024-06',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.75,
          createdAt: '2024-06-01T00:00:00.000Z',
        };
        mockStore.rates = [pastRate, futureRate];

        const rate = await getRateForMonth('2024-03', CurrencyCode.SGD, CurrencyCode.USD);
        expect(rate).toBe(0.73); // 2 months away is closer than 3 months
      });

      it('should find rate up to 12 months in the past', async () => {
        const oldRate: ExchangeRate = {
          id: 'rate-1',
          month: '2023-03',
          fromCurrency: CurrencyCode.AUD,
          toCurrency: CurrencyCode.USD,
          rate: 0.68,
          createdAt: '2023-03-01T00:00:00.000Z',
        };
        mockStore.rates = [oldRate];

        const rate = await getRateForMonth('2024-03', CurrencyCode.AUD, CurrencyCode.USD);
        expect(rate).toBe(0.68);
      });

      it('should find rate up to 12 months in the future', async () => {
        const futureRate: ExchangeRate = {
          id: 'rate-1',
          month: '2025-03',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.000042,
          createdAt: '2025-03-01T00:00:00.000Z',
        };
        mockStore.rates = [futureRate];

        const rate = await getRateForMonth('2024-03', CurrencyCode.VND, CurrencyCode.USD);
        expect(rate).toBe(0.000042);
      });

      it('should handle year boundaries correctly when looking back', async () => {
        const decemberRate: ExchangeRate = {
          id: 'rate-1',
          month: '2023-12',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.745,
          createdAt: '2023-12-01T00:00:00.000Z',
        };
        mockStore.rates = [decemberRate];

        const rate = await getRateForMonth('2024-01', CurrencyCode.SGD, CurrencyCode.USD);
        expect(rate).toBe(0.745);
      });

      it('should handle year boundaries correctly when looking forward', async () => {
        const januaryRate: ExchangeRate = {
          id: 'rate-1',
          month: '2025-01',
          fromCurrency: CurrencyCode.AUD,
          toCurrency: CurrencyCode.USD,
          rate: 0.67,
          createdAt: '2025-01-01T00:00:00.000Z',
        };
        mockStore.rates = [januaryRate];

        const rate = await getRateForMonth('2024-12', CurrencyCode.AUD, CurrencyCode.USD);
        expect(rate).toBe(0.67);
      });
    });

    describe('API fetch when no cache', () => {
      it('should fetch from API when no cached or fallback rate exists', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            rates: {
              USD: 0.74,
            },
          }),
        });

        const rate = await getRateForMonth('2024-03', CurrencyCode.SGD, CurrencyCode.USD);
        expect(rate).toBe(0.74);
        expect(global.fetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/SGD');
        expect(mockStore.addRate).toHaveBeenCalled();
      });

      it('should fetch from API with conversion_rates format', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            conversion_rates: {
              USD: 0.65,
            },
          }),
        });

        const rate = await getRateForMonth('2024-03', CurrencyCode.AUD, CurrencyCode.USD);
        expect(rate).toBe(0.65);
        expect(global.fetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/AUD');
      });

      it('should throw error when API returns non-ok status', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(
          getRateForMonth('2024-03', CurrencyCode.VND, CurrencyCode.USD)
        ).rejects.toThrow('Exchange rate API returned 404 for VND');
      });

      it('should throw error when API returns error in response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            error: 'Invalid currency code',
          }),
        });

        await expect(
          getRateForMonth('2024-03', CurrencyCode.SGD, CurrencyCode.USD)
        ).rejects.toThrow('Exchange rate API error: Invalid currency code');
      });

      it('should throw error when no rates found in API response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await expect(
          getRateForMonth('2024-03', CurrencyCode.AUD, CurrencyCode.USD)
        ).rejects.toThrow('No rates found in API response');
      });

      it('should throw error when USD rate not found in API response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            rates: {
              EUR: 0.9,
            },
          }),
        });

        await expect(
          getRateForMonth('2024-03', CurrencyCode.VND, CurrencyCode.USD)
        ).rejects.toThrow('No rate found for USD in API response');
      });
    });

    describe('complex conversion scenarios', () => {
      it('should handle USD to SGD conversion using inverse', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            rates: {
              USD: 0.74,
            },
          }),
        });

        const rate = await getRateForMonth('2024-03', CurrencyCode.USD, CurrencyCode.SGD);
        expect(rate).toBeCloseTo(1 / 0.74, 10);
      });

      it('should handle SGD to AUD conversion through USD', async () => {
        // First call for SGD->USD
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            rates: {
              USD: 0.74,
            },
          }),
        });

        // Second call for AUD->USD
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            rates: {
              USD: 0.65,
            },
          }),
        });

        const rate = await getRateForMonth('2024-03', CurrencyCode.SGD, CurrencyCode.AUD);
        expect(rate).toBeCloseTo(0.74 / 0.65, 10);
      });

      it('should not fetch twice for X->Y conversion if cached after first fetch', async () => {
        // First fetch for SGD->USD
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            rates: {
              USD: 0.74,
            },
          }),
        });

        // Set up mock to simulate rate being added to cache
        mockStore.addRate.mockImplementation((rate) => {
          mockStore.rates.push(rate);
        });

        // Already have AUD->USD in cache
        const audRate: ExchangeRate = {
          id: 'rate-2',
          month: '2024-03',
          fromCurrency: CurrencyCode.AUD,
          toCurrency: CurrencyCode.USD,
          rate: 0.65,
          createdAt: '2024-03-01T00:00:00.000Z',
        };
        mockStore.rates = [audRate];

        const rate = await getRateForMonth('2024-03', CurrencyCode.SGD, CurrencyCode.AUD);
        expect(rate).toBeCloseTo(0.74 / 0.65, 10);
        expect(global.fetch).toHaveBeenCalledTimes(1); // Only fetched SGD->USD
      });
    });

    describe('month format handling', () => {
      it('should handle single digit months with padding', async () => {
        const cachedRate: ExchangeRate = {
          id: 'rate-1',
          month: '2024-01',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.00004,
          createdAt: '2024-01-01T00:00:00.000Z',
        };
        mockStore.rates = [cachedRate];

        const rate = await getRateForMonth('2024-01', CurrencyCode.VND, CurrencyCode.USD);
        expect(rate).toBe(0.00004);
      });

      it('should handle double digit months', async () => {
        const cachedRate: ExchangeRate = {
          id: 'rate-1',
          month: '2024-12',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.75,
          createdAt: '2024-12-01T00:00:00.000Z',
        };
        mockStore.rates = [cachedRate];

        const rate = await getRateForMonth('2024-12', CurrencyCode.SGD, CurrencyCode.USD);
        expect(rate).toBe(0.75);
      });
    });
  });
});
