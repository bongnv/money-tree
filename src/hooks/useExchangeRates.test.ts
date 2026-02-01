import { renderHook, waitFor } from '@testing-library/react';
import { useExchangeRatesArray, useExchangeRates } from './useExchangeRates';
import { useExchangeRateService } from './useServices';
import { fetchRateFromAPI } from '@/utils/exchangeRate.utils';
import { CurrencyCode } from '@/types/enums';
import type { ExchangeRate } from '../types/models';

// Mock dependencies
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn((fn) => fn()),
}));

jest.mock('./useServices', () => ({
  useExchangeRateService: jest.fn(),
}));

jest.mock('@/utils/exchangeRate.utils', () => ({
  fetchRateFromAPI: jest.fn(),
}));

jest.mock('@/utils/date.utils', () => ({
  getCurrentMonth: jest.fn(() => '2026-02'),
}));

describe('useExchangeRates', () => {
  const mockExchangeRateService = {
    getAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useExchangeRateService as jest.Mock).mockReturnValue(mockExchangeRateService);
  });

  describe('useExchangeRatesArray', () => {
    it('should return undefined while loading', () => {
      mockExchangeRateService.getAll.mockReturnValue(undefined);

      const { result } = renderHook(() => useExchangeRatesArray());

      expect(result.current).toBeUndefined();
    });

    it('should return empty array when no rates exist', () => {
      mockExchangeRateService.getAll.mockReturnValue([]);

      const { result } = renderHook(() => useExchangeRatesArray());

      expect(result.current).toEqual([]);
    });

    it('should return existing rates', () => {
      const mockRates: ExchangeRate[] = [
        {
          id: 'rate-1',
          month: '2026-02',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.00004,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
        {
          id: 'rate-2',
          month: '2026-02',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.75,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];

      mockExchangeRateService.getAll.mockReturnValue(mockRates);

      const { result } = renderHook(() => useExchangeRatesArray());

      expect(result.current).toEqual(mockRates);
    });

    it('should fetch missing rates for current month', async () => {
      const existingRates: ExchangeRate[] = [
        {
          id: 'rate-1',
          month: '2026-02',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.00004,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];

      mockExchangeRateService.getAll.mockReturnValue(existingRates);
      (fetchRateFromAPI as jest.Mock).mockResolvedValue(0.75);

      renderHook(() => useExchangeRatesArray());

      await waitFor(() => {
        expect(fetchRateFromAPI).toHaveBeenCalledWith(CurrencyCode.SGD);
        expect(fetchRateFromAPI).toHaveBeenCalledWith(CurrencyCode.AUD);
      });

      await waitFor(() => {
        expect(mockExchangeRateService.create).toHaveBeenCalledTimes(2);
      });
    });

    it('should not fetch rates when all current month rates exist', async () => {
      const existingRates: ExchangeRate[] = [
        {
          id: 'rate-1',
          month: '2026-02',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.00004,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
        {
          id: 'rate-2',
          month: '2026-02',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.75,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
        {
          id: 'rate-3',
          month: '2026-02',
          fromCurrency: CurrencyCode.AUD,
          toCurrency: CurrencyCode.USD,
          rate: 0.7,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];

      mockExchangeRateService.getAll.mockReturnValue(existingRates);

      renderHook(() => useExchangeRatesArray());

      // Wait a bit to ensure no fetches occur
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fetchRateFromAPI).not.toHaveBeenCalled();
    });

    it('should skip USD currency when fetching rates', async () => {
      mockExchangeRateService.getAll.mockReturnValue([]);
      (fetchRateFromAPI as jest.Mock).mockResolvedValue(0.75);

      renderHook(() => useExchangeRatesArray());

      await waitFor(() => {
        expect(fetchRateFromAPI).toHaveBeenCalledTimes(3); // VND, SGD, AUD only
      });

      expect(fetchRateFromAPI).not.toHaveBeenCalledWith(CurrencyCode.USD);
    });

    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockExchangeRateService.getAll.mockReturnValue([]);
      (fetchRateFromAPI as jest.Mock).mockRejectedValue(new Error('API Error'));

      renderHook(() => useExchangeRatesArray());

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching exchange rates:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not fetch if already fetching', async () => {
      mockExchangeRateService.getAll.mockReturnValue([]);
      (fetchRateFromAPI as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(0.75), 100))
      );

      const { rerender } = renderHook(() => useExchangeRatesArray());

      // Trigger multiple renders while fetching
      rerender();
      rerender();
      rerender();

      await waitFor(
        () => {
          expect(fetchRateFromAPI).toHaveBeenCalledTimes(3);
        },
        { timeout: 2000 }
      );

      // Should only call once per currency despite multiple renders
      expect(fetchRateFromAPI).toHaveBeenCalledTimes(3);
    });

    it('should create rate with correct structure', async () => {
      mockExchangeRateService.getAll.mockReturnValue([]);
      (fetchRateFromAPI as jest.Mock).mockResolvedValue(0.75);

      renderHook(() => useExchangeRatesArray());

      await waitFor(() => {
        expect(mockExchangeRateService.create).toHaveBeenCalled();
      });

      const createdRate = mockExchangeRateService.create.mock.calls[0][0];
      expect(createdRate).toMatchObject({
        id: expect.stringMatching(/^rate-\d+-[a-z0-9]+$/),
        month: '2026-02',
        fromCurrency: expect.any(String),
        toCurrency: CurrencyCode.USD,
        rate: 0.75,
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      });
    });
  });

  describe('useExchangeRates', () => {
    it('should return undefined while loading', () => {
      mockExchangeRateService.getAll.mockReturnValue(undefined);

      const { result } = renderHook(() => useExchangeRates());

      expect(result.current).toBeUndefined();
    });

    it('should return empty map when no rates exist', () => {
      mockExchangeRateService.getAll.mockReturnValue([]);

      const { result } = renderHook(() => useExchangeRates());

      expect(result.current).toBeInstanceOf(Map);
      expect(result.current?.size).toBe(0);
    });

    it('should convert rates array to map with correct keys', () => {
      const mockRates: ExchangeRate[] = [
        {
          id: 'rate-1',
          month: '2026-01',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.00004,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'rate-2',
          month: '2026-01',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.75,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'rate-3',
          month: '2025-12',
          fromCurrency: CurrencyCode.AUD,
          toCurrency: CurrencyCode.USD,
          rate: 0.7,
          createdAt: '2025-12-01T00:00:00.000Z',
        },
      ];

      mockExchangeRateService.getAll.mockReturnValue(mockRates);

      const { result } = renderHook(() => useExchangeRates());

      expect(result.current?.size).toBe(3);
      expect(result.current?.get('2026-01_VND_USD')).toBe(0.00004);
      expect(result.current?.get('2026-01_SGD_USD')).toBe(0.75);
      expect(result.current?.get('2025-12_AUD_USD')).toBe(0.7);
    });

    it('should handle rates with same currency but different months', () => {
      const mockRates: ExchangeRate[] = [
        {
          id: 'rate-1',
          month: '2026-02',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.00004,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
        {
          id: 'rate-2',
          month: '2025-12',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.000039,
          createdAt: '2025-12-01T00:00:00.000Z',
        },
      ];

      mockExchangeRateService.getAll.mockReturnValue(mockRates);

      const { result } = renderHook(() => useExchangeRates());

      expect(result.current?.size).toBe(2);
      expect(result.current?.get('2026-02_VND_USD')).toBe(0.00004);
      expect(result.current?.get('2025-12_VND_USD')).toBe(0.000039);
    });

    it('should update map when rates change', () => {
      const initialRates: ExchangeRate[] = [
        {
          id: 'rate-1',
          month: '2026-02',
          fromCurrency: CurrencyCode.VND,
          toCurrency: CurrencyCode.USD,
          rate: 0.00004,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];

      mockExchangeRateService.getAll.mockReturnValue(initialRates);

      const { result, rerender } = renderHook(() => useExchangeRates());

      expect(result.current?.size).toBe(1);

      // Update rates
      const updatedRates: ExchangeRate[] = [
        ...initialRates,
        {
          id: 'rate-2',
          month: '2026-02',
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.75,
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];

      mockExchangeRateService.getAll.mockReturnValue(updatedRates);
      rerender();

      expect(result.current?.size).toBe(2);
      expect(result.current?.get('2026-02_SGD_USD')).toBe(0.75);
    });
  });
});
