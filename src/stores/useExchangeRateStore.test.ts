import { useExchangeRateStore } from './useExchangeRateStore';

describe('useExchangeRateStore', () => {
  beforeEach(() => {
    useExchangeRateStore.getState().resetRates();
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

    it('should update existing rate instead of creating duplicate', () => {
      const initialRate = {
        id: 'rate-1',
        month: '2026-01',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.18,
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      useExchangeRateStore.getState().addRate(initialRate);

      const updatedRate = {
        ...initialRate,
        rate: 1.2,
      };

      useExchangeRateStore.getState().addRate(updatedRate);

      expect(useExchangeRateStore.getState().rates).toHaveLength(1);
      expect(useExchangeRateStore.getState().rates[0].rate).toBe(1.2);
    });
  });

  describe('resetRates', () => {
    it('should reset all rates', () => {
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
      useExchangeRateStore.getState().resetRates();
      expect(useExchangeRateStore.getState().rates).toEqual([]);
    });
  });
});
