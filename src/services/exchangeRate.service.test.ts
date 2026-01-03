import {
  fetchCurrentRate,
  findFallbackRate,
  getTransactionMonth,
  getCurrentMonth,
  getAllMonthsInYear,
} from './exchangeRate.service';

// Mock fetch for API tests
global.fetch = jest.fn();

describe('exchangeRate.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCurrentRate', () => {
    it('should return 1 for same currency', async () => {
      const rate = await fetchCurrentRate('USD', 'USD');
      expect(rate).toBe(1);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch rate from API successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          rates: {
            USD: 1.18,
            GBP: 0.85,
          },
        }),
      });

      const rate = await fetchCurrentRate('EUR', 'USD');
      expect(rate).toBe(1.18);
      expect(fetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/EUR');
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const rate = await fetchCurrentRate('EUR', 'USD');
      expect(rate).toBeNull();
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const rate = await fetchCurrentRate('EUR', 'USD');
      expect(rate).toBeNull();
    });

    it('should handle missing target currency in response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          rates: {
            GBP: 0.85,
          },
        }),
      });

      const rate = await fetchCurrentRate('EUR', 'USD');
      expect(rate).toBeNull();
    });

    it('should handle API error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'Invalid currency',
        }),
      });

      const rate = await fetchCurrentRate('INVALID', 'USD');
      expect(rate).toBeNull();
    });

    it('should use USD as intermediate when direct rate not available', async () => {
      // Mock VND → SGD direct fetch (no SGD in VND rates)
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          rates: {
            USD: 0.000041, // VND to USD
            EUR: 0.000038,
          },
        }),
      });

      // Mock VND → USD fetch
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          rates: {
            USD: 0.000041, // VND to USD
          },
        }),
      });

      // Mock USD → SGD fetch
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          rates: {
            SGD: 1.35, // USD to SGD
          },
        }),
      });

      const rate = await fetchCurrentRate('VND', 'SGD');

      // Should calculate: VND → USD (0.000041) * USD → SGD (1.35) = 0.000055
      expect(rate).toBeCloseTo(0.000041 * 1.35, 8);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should return null when USD intermediate also fails', async () => {
      // Mock direct fetch fails (no EUR in GBP rates)
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          rates: {
            USD: 1.25,
          },
        }),
      });

      // Mock GBP → USD fetch fails
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const rate = await fetchCurrentRate('GBP', 'EUR');
      expect(rate).toBeNull();
    });
  });

  describe('findFallbackRate', () => {
    const mockRates = [
      { month: '2026-01', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.18 },
      { month: '2026-02', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.19 },
      { month: '2025-12', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.17 },
      { month: '2025-11', fromCurrency: 'GBP', toCurrency: 'USD', rate: 1.25 },
    ];

    it('should return 1 for same currency', () => {
      const rate = findFallbackRate(mockRates, '2026-03', 'USD', 'USD');
      expect(rate).toBe(1);
    });

    it('should find rate from previous month', () => {
      const rate = findFallbackRate(mockRates, '2026-03', 'EUR', 'USD');
      expect(rate).toBe(1.19); // February 2026
    });

    it('should find rate from multiple months back', () => {
      const rate = findFallbackRate(mockRates, '2026-05', 'EUR', 'USD');
      expect(rate).toBe(1.19); // February 2026 (3 months back)
    });

    it('should return null if no rate found within 12 months', () => {
      const rate = findFallbackRate(mockRates, '2027-03', 'EUR', 'USD');
      expect(rate).toBeNull();
    });

    it('should return null if currency pair not found', () => {
      const rate = findFallbackRate(mockRates, '2026-03', 'JPY', 'USD');
      expect(rate).toBeNull();
    });

    it('should handle year boundaries correctly', () => {
      const rate = findFallbackRate(mockRates, '2026-01', 'EUR', 'USD');
      expect(rate).toBe(1.17); // December 2025
    });
  });

  describe('getTransactionMonth', () => {
    it('should extract month from date string', () => {
      expect(getTransactionMonth('2026-01-15')).toBe('2026-01');
      expect(getTransactionMonth('2025-12-31')).toBe('2025-12');
      expect(getTransactionMonth('2026-03-01')).toBe('2026-03');
    });
  });

  describe('getCurrentMonth', () => {
    it('should return current month in YYYY-MM format', () => {
      const result = getCurrentMonth();
      expect(result).toMatch(/^\d{4}-\d{2}$/);

      // Verify it's a valid month
      const [year, month] = result.split('-').map(Number);
      expect(year).toBeGreaterThan(2020);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
    });
  });

  describe('getAllMonthsInYear', () => {
    it('should return all 12 months for a year', () => {
      const months = getAllMonthsInYear(2026);
      expect(months).toHaveLength(12);
      expect(months[0]).toBe('2026-01');
      expect(months[11]).toBe('2026-12');
    });

    it('should format months with leading zeros', () => {
      const months = getAllMonthsInYear(2025);
      months.forEach((month) => {
        expect(month).toMatch(/^\d{4}-\d{2}$/);
      });
    });
  });
});
