import { useExchangeRateStore } from './useExchangeRateStore';
import * as exchangeRateService from '../services/exchangeRate.service';

// Mock the exchange rate service
jest.mock('../services/exchangeRate.service');

describe('useExchangeRateStore', () => {
  beforeEach(() => {
    useExchangeRateStore.getState().resetRates();
    jest.clearAllMocks();
  });

  describe('setRates', () => {
    it('should set rates', () => {
      const rates = [
        {
          id: 'rate-1',
          month: '2026-01',
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.18,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      useExchangeRateStore.getState().setRates(rates);
      expect(useExchangeRateStore.getState().rates).toEqual(rates);
    });
  });

  describe('getRateForMonth', () => {
    beforeEach(() => {
      const rates = [
        {
          id: 'rate-1',
          month: '2026-01',
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.18,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'rate-2',
          month: '2026-02',
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.19,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];
      useExchangeRateStore.getState().setRates(rates);
    });

    it('should return 1 for same currency', () => {
      const rate = useExchangeRateStore.getState().getRateForMonth('2026-01', 'USD', 'USD');
      expect(rate).toBe(1);
    });

    it('should find exact rate for month', () => {
      const rate = useExchangeRateStore.getState().getRateForMonth('2026-01', 'EUR', 'USD');
      expect(rate).toBe(1.18);
    });

    it('should use findFallbackRate when exact rate not found', () => {
      const mockFindFallbackRate = jest.spyOn(exchangeRateService, 'findFallbackRate');
      mockFindFallbackRate.mockReturnValue(1.19);

      useExchangeRateStore.getState().getRateForMonth('2026-03', 'EUR', 'USD');
      expect(mockFindFallbackRate).toHaveBeenCalledWith(expect.any(Array), '2026-03', 'EUR', 'USD');
    });
  });

  describe('fetchRateIfMissing', () => {
    it('should fetch rate from API if missing', async () => {
      const mockFetchMonthlyRate = jest.spyOn(exchangeRateService, 'fetchMonthlyRate');
      mockFetchMonthlyRate.mockResolvedValue(1.2);

      const rate = await useExchangeRateStore
        .getState()
        .fetchRateIfMissing('2026-01', 'EUR', 'USD');

      expect(rate).toBe(1.2);
      expect(mockFetchMonthlyRate).toHaveBeenCalledWith('2026-01', 'EUR', 'USD');
      expect(useExchangeRateStore.getState().rates).toHaveLength(1);
      expect(useExchangeRateStore.getState().rates[0].rate).toBe(1.2);
    });

    it('should return existing rate without fetching', async () => {
      const existingRate = {
        id: 'rate-1',
        month: '2026-01',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.18,
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      useExchangeRateStore.getState().setRates([existingRate]);

      const mockFetchMonthlyRate = jest.spyOn(exchangeRateService, 'fetchMonthlyRate');

      const rate = await useExchangeRateStore
        .getState()
        .fetchRateIfMissing('2026-01', 'EUR', 'USD');

      expect(rate).toBe(1.18);
      expect(mockFetchMonthlyRate).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockFetchMonthlyRate = jest.spyOn(exchangeRateService, 'fetchMonthlyRate');
      mockFetchMonthlyRate.mockResolvedValue(null);

      await useExchangeRateStore.getState().fetchRateIfMissing('2026-01', 'EUR', 'USD');

      expect(useExchangeRateStore.getState().errors['2026-01-EUR-USD']).toContain(
        'Failed to fetch'
      );
    });
  });

  describe('listMissingRates', () => {
    beforeEach(() => {
      const rates = [
        {
          id: 'rate-1',
          month: '2026-01',
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.18,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      useExchangeRateStore.getState().setRates(rates);

      // Mock findFallbackRate to return null for missing rates
      jest
        .spyOn(exchangeRateService, 'findFallbackRate')
        .mockImplementation((rates, month, from, to) => {
          const found = rates.find(
            (r) => r.month === month && r.fromCurrency === from && r.toCurrency === to
          );
          return found ? found.rate : null;
        });
    });

    it('should identify missing rates', () => {
      const requiredRates = [
        { month: '2026-01', fromCurrency: 'EUR', toCurrency: 'USD' }, // exists
        { month: '2026-02', fromCurrency: 'EUR', toCurrency: 'USD' }, // missing
        { month: '2026-01', fromCurrency: 'GBP', toCurrency: 'USD' }, // missing
        { month: '2026-01', fromCurrency: 'USD', toCurrency: 'USD' }, // same currency, skip
      ];

      const missing = useExchangeRateStore.getState().listMissingRates(requiredRates);

      expect(missing).toHaveLength(2);
      expect(missing).toContainEqual({ month: '2026-02', fromCurrency: 'EUR', toCurrency: 'USD' });
      expect(missing).toContainEqual({ month: '2026-01', fromCurrency: 'GBP', toCurrency: 'USD' });
    });

    it('should return empty array when all rates exist', () => {
      const requiredRates = [{ month: '2026-01', fromCurrency: 'EUR', toCurrency: 'USD' }];

      const missing = useExchangeRateStore.getState().listMissingRates(requiredRates);
      expect(missing).toHaveLength(0);
    });
  });

  describe('addRate', () => {
    it('should add a new rate', () => {
      const newRate = {
        id: 'rate-1',
        month: '2026-01',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.18,
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      useExchangeRateStore.getState().addRate(newRate);
      expect(useExchangeRateStore.getState().rates).toHaveLength(1);
      expect(useExchangeRateStore.getState().rates[0]).toEqual(newRate);
    });
  });

  describe('updateRate', () => {
    it('should update an existing rate', () => {
      const initialRate = {
        id: 'rate-1',
        month: '2026-01',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.18,
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      useExchangeRateStore.getState().setRates([initialRate]);

      useExchangeRateStore.getState().updateRate('rate-1', { rate: 1.2 });

      expect(useExchangeRateStore.getState().rates[0].rate).toBe(1.2);
    });
  });

  describe('deleteRate', () => {
    it('should delete a rate', () => {
      const rate = {
        id: 'rate-1',
        month: '2026-01',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.18,
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      useExchangeRateStore.getState().setRates([rate]);

      useExchangeRateStore.getState().deleteRate('rate-1');
      expect(useExchangeRateStore.getState().rates).toHaveLength(0);
    });
  });

  describe('resetRates', () => {
    it('should reset all rates', () => {
      useExchangeRateStore.getState().setRates([
        {
          id: 'rate-1',
          month: '2026-01',
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.18,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);

      useExchangeRateStore.getState().resetRates();

      expect(useExchangeRateStore.getState().rates).toHaveLength(0);
      expect(useExchangeRateStore.getState().loading).toEqual({});
      expect(useExchangeRateStore.getState().errors).toEqual({});
    });
  });
});
