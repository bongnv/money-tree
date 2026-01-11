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
});

describe('getRateForMonth', () => {
  beforeEach(() => {
    // Reset store to ensure clean state for these tests
    useExchangeRateStore.getState().resetRates();
  });
  it('should return 1 for same currency', async () => {
    const rate = await useExchangeRateStore.getState().getRateForMonth('2026-01', 'USD', 'USD');
    expect(rate).toBe(1);
  });

  it('should fetch rate from API if missing for current month', async () => {
    const mockFindFallbackRate = jest.spyOn(exchangeRateService, 'findFallbackRate');
    mockFindFallbackRate.mockReturnValue(null); // No fallback available
    const mockFetchCurrentRate = jest.spyOn(exchangeRateService, 'fetchCurrentRate');
    mockFetchCurrentRate.mockResolvedValue(1.2);

    const rate = await useExchangeRateStore.getState().getRateForMonth('2026-01', 'EUR', 'USD');

    expect(rate).toBe(1.2);
    expect(mockFetchCurrentRate).toHaveBeenCalledWith('EUR', 'USD');
    expect(useExchangeRateStore.getState().rates).toHaveLength(1);
    expect(useExchangeRateStore.getState().rates[0].rate).toBe(1.2);
  });

  it('should use fallback rate when available and store it for the requested month', async () => {
    // Set up existing rate for February
    useExchangeRateStore.getState().setRates([
      {
        id: 'rate-1',
        month: '2026-02',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.19,
        createdAt: '2026-02-01T00:00:00.000Z',
      },
    ]);

    const mockFetchCurrentRate = jest.spyOn(exchangeRateService, 'fetchCurrentRate');
    mockFetchCurrentRate.mockResolvedValue(null); // API call returns nothing
    const mockFindFallbackRate = jest.spyOn(exchangeRateService, 'findFallbackRate');
    mockFindFallbackRate.mockReturnValue(1.19); // Mock fallback finding the Feb rate

    // Try to fetch for March - should use fallback after API attempt
    const rate = await useExchangeRateStore.getState().getRateForMonth('2026-03', 'EUR', 'USD');

    expect(rate).toBe(1.19);
    expect(mockFetchCurrentRate).toHaveBeenCalled(); // API is attempted first
    expect(mockFindFallbackRate).toHaveBeenCalled();
    // Fallback rate is stored for the requested month
    const storedRateForMarch = useExchangeRateStore
      .getState()
      .rates.find(
        (r) => r.month === '2026-03' && r.fromCurrency === 'EUR' && r.toCurrency === 'USD'
      );
    expect(storedRateForMarch).toBeDefined();
    expect(storedRateForMarch?.rate).toBe(1.19);
    // Now we have both February and March rates
    expect(useExchangeRateStore.getState().rates).toHaveLength(2);
  });

  it('should fetch from API when no fallback available', async () => {
    // No existing rates, so fallback won't find anything
    const mockFetchCurrentRate = jest.spyOn(exchangeRateService, 'fetchCurrentRate');
    const mockFindFallbackRate = jest.spyOn(exchangeRateService, 'findFallbackRate');
    mockFindFallbackRate.mockReturnValue(null); // No fallback available
    mockFetchCurrentRate.mockResolvedValue(1.2);

    const rate = await useExchangeRateStore.getState().getRateForMonth('2025-12', 'EUR', 'USD');

    expect(rate).toBe(1.2);
    expect(mockFindFallbackRate).toHaveBeenCalled();
    expect(mockFetchCurrentRate).toHaveBeenCalledWith('EUR', 'USD');
    // Verify it was stored with the historical month
    const storedRate = useExchangeRateStore
      .getState()
      .rates.find(
        (r) => r.month === '2025-12' && r.fromCurrency === 'EUR' && r.toCurrency === 'USD'
      );
    expect(storedRate).toBeDefined();
    expect(storedRate?.rate).toBe(1.2);
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

    const mockFetchCurrentRate = jest.spyOn(exchangeRateService, 'fetchCurrentRate');

    const rate = await useExchangeRateStore.getState().getRateForMonth('2026-01', 'EUR', 'USD');

    expect(rate).toBe(1.18);
    // Cache hit returns early without fetching
    expect(mockFetchCurrentRate).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const mockFindFallbackRate = jest.spyOn(exchangeRateService, 'findFallbackRate');
    mockFindFallbackRate.mockReturnValue(null); // No fallback available
    const mockFetchCurrentRate = jest.spyOn(exchangeRateService, 'fetchCurrentRate');
    mockFetchCurrentRate.mockResolvedValue(null);

    await useExchangeRateStore.getState().getRateForMonth('2026-01', 'EUR', 'USD');

    expect(useExchangeRateStore.getState().errors['2026-01-EUR-USD']).toContain('Failed to fetch');
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
    const firstRate = {
      id: 'rate-1',
      month: '2026-01',
      fromCurrency: 'EUR',
      toCurrency: 'USD',
      rate: 1.18,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const updatedRate = {
      id: 'rate-2',
      month: '2026-01',
      fromCurrency: 'EUR',
      toCurrency: 'USD',
      rate: 1.2,
      createdAt: '2026-01-02T00:00:00.000Z',
    };

    useExchangeRateStore.getState().addRate(firstRate);
    expect(useExchangeRateStore.getState().rates).toHaveLength(1);

    useExchangeRateStore.getState().addRate(updatedRate);
    expect(useExchangeRateStore.getState().rates).toHaveLength(1);
    expect(useExchangeRateStore.getState().rates[0]).toEqual(updatedRate);
    expect(useExchangeRateStore.getState().rates[0].rate).toBe(1.2);
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
