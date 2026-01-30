import { ExchangeRateService } from './exchangeRate.service';
import { db } from '../db/database';
import type { ExchangeRate } from '../types/models';
import { CurrencyCode } from '@/types/enums';
import type { SyncMetadataService } from './syncMetadata.service';

const mockSyncMetadataService = {
  setLastModified: jest.fn(),
} as unknown as SyncMetadataService;

jest.mock('../db/database', () => ({
  db: {
    exchangeRates: {
      toArray: jest.fn(),
      get: jest.fn(),
      where: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    syncMetadata: {
      put: jest.fn(),
      get: jest.fn(),
    },
  },
}));

describe('exchangeRateService', () => {
  let exchangeRateService: ExchangeRateService;
  const mockExchangeRate: ExchangeRate = {
    id: '1',
    month: '2024-01',
    fromCurrency: CurrencyCode.USD,
    toCurrency: CurrencyCode.VND,
    rate: 0.92,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    exchangeRateService = new ExchangeRateService(db, mockSyncMetadataService);
  });

  describe('getAll', () => {
    it('should return all exchange rates', async () => {
      (db.exchangeRates.toArray as jest.Mock).mockResolvedValue([mockExchangeRate]);

      const result = await exchangeRateService.getAll();

      expect(result).toEqual([mockExchangeRate]);
    });
  });

  describe('getByMonth', () => {
    it('should return exchange rates by month', async () => {
      const mockWhere = {
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockExchangeRate]),
        }),
      };
      (db.exchangeRates.where as jest.Mock).mockReturnValue(mockWhere);

      const result = await exchangeRateService.getByMonth('2024-01');

      expect(result).toEqual([mockExchangeRate]);
      expect(db.exchangeRates.where).toHaveBeenCalledWith('month');
      expect(mockWhere.equals).toHaveBeenCalledWith('2024-01');
    });
  });

  describe('getByMonthAndCurrencies', () => {
    it('should return exchange rate by month and currencies', async () => {
      const mockWhere = {
        equals: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockExchangeRate),
        }),
      };
      (db.exchangeRates.where as jest.Mock).mockReturnValue(mockWhere);

      const result = await exchangeRateService.getByMonthAndCurrencies(
        '2024-01',
        CurrencyCode.USD,
        CurrencyCode.VND
      );

      expect(result).toEqual(mockExchangeRate);
      expect(db.exchangeRates.where).toHaveBeenCalledWith(['month', 'fromCurrency', 'toCurrency']);
      expect(mockWhere.equals).toHaveBeenCalledWith([
        '2024-01',
        CurrencyCode.USD,
        CurrencyCode.VND,
      ]);
    });
  });

  describe('create', () => {
    it('should create a new exchange rate', async () => {
      const newRate = {
        month: '2024-02',
        fromCurrency: CurrencyCode.SGD,
        toCurrency: CurrencyCode.USD,
        rate: 1.27,
      };
      (db.exchangeRates.add as jest.Mock).mockResolvedValue('2');

      const id = await exchangeRateService.create(newRate);

      expect(id).toBe('2');
      expect(db.exchangeRates.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newRate,
          createdAt: expect.any(String),
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing exchange rate', async () => {
      (db.exchangeRates.get as jest.Mock).mockResolvedValue(mockExchangeRate);
      (db.exchangeRates.update as jest.Mock).mockResolvedValue(1);

      await exchangeRateService.update('1', { rate: 0.95 });

      expect(db.exchangeRates.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          rate: 0.95,
        })
      );
    });
  });

  describe('upsert', () => {
    it('should update existing exchange rate', async () => {
      const mockWhere = {
        equals: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockExchangeRate),
        }),
      };
      (db.exchangeRates.where as jest.Mock).mockReturnValue(mockWhere);
      (db.exchangeRates.get as jest.Mock).mockResolvedValue(mockExchangeRate);
      (db.exchangeRates.update as jest.Mock).mockResolvedValue(1);

      const data = {
        month: '2024-01',
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.VND,
        rate: 0.95,
      };

      const id = await exchangeRateService.upsert(data);

      expect(id).toBe('1');
      expect(db.exchangeRates.update).toHaveBeenCalled();
    });

    it('should create new exchange rate if not exists', async () => {
      const mockWhere = {
        equals: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(undefined),
        }),
      };
      (db.exchangeRates.where as jest.Mock).mockReturnValue(mockWhere);
      (db.exchangeRates.add as jest.Mock).mockResolvedValue('2');

      const data = {
        month: '2024-02',
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.VND,
        rate: 0.93,
      };

      const id = await exchangeRateService.upsert(data);

      expect(id).toBe('2');
      expect(db.exchangeRates.add).toHaveBeenCalled();
    });
  });
});
