import { fetchCurrentRate } from './exchangeRate.service';

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
});
