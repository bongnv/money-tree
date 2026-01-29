import { syncMetadataService } from './syncMetadata.service';
import { db } from '../db/database';
import { CurrencyCode } from '../types/enums';
import type { ArchivedYearReference } from '../types/models';

jest.mock('../db/database', () => ({
  db: {
    syncMetadata: {
      get: jest.fn(),
      put: jest.fn(),
      clear: jest.fn(),
    },
  },
}));

describe('syncMetadataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setBaseCurrency', () => {
    it('should set base currency and update lastModified', async () => {
      await syncMetadataService.setBaseCurrency(CurrencyCode.USD);

      expect(db.syncMetadata.put).toHaveBeenCalledWith({
        key: 'baseCurrency',
        value: CurrencyCode.USD,
      });
      expect(db.syncMetadata.put).toHaveBeenCalledWith({
        key: 'lastModified',
        value: expect.any(String),
      });
    });
  });

  describe('addArchivedYear', () => {
    it('should add archived year and update lastModified', async () => {
      const archivedYear: ArchivedYearReference = {
        year: 2023,
        archivedDate: '2024-01-01T00:00:00.000Z',
        summary: {
          totalIncome: 50000,
          totalExpenses: 30000,
          netSavings: 20000,
          categories: [],
        },
      };

      (db.syncMetadata.get as jest.Mock).mockResolvedValue({ key: 'archivedYears', value: [] });

      await syncMetadataService.addArchivedYear(archivedYear);

      expect(db.syncMetadata.put).toHaveBeenCalledWith({
        key: 'archivedYears',
        value: [archivedYear],
      });
      expect(db.syncMetadata.put).toHaveBeenCalledWith({
        key: 'lastModified',
        value: expect.any(String),
      });
    });
  });

  describe('getBaseCurrency', () => {
    it('should return base currency', async () => {
      (db.syncMetadata.get as jest.Mock).mockResolvedValue({
        key: 'baseCurrency',
        value: CurrencyCode.USD,
      });

      const result = await syncMetadataService.getBaseCurrency();

      expect(result).toBe(CurrencyCode.USD);
      expect(db.syncMetadata.get).toHaveBeenCalledWith('baseCurrency');
    });

    it('should return default USD if no base currency set', async () => {
      (db.syncMetadata.get as jest.Mock).mockResolvedValue(undefined);

      const result = await syncMetadataService.getBaseCurrency();

      expect(result).toBe(CurrencyCode.USD);
    });
  });

  describe('getArchivedYears', () => {
    it('should return archived years', async () => {
      const mockYears: ArchivedYearReference[] = [
        {
          year: 2023,
          archivedDate: '2024-01-01T00:00:00.000Z',
          summary: {
            totalIncome: 50000,
            totalExpenses: 30000,
            netSavings: 20000,
            categories: [],
          },
        },
      ];
      (db.syncMetadata.get as jest.Mock).mockResolvedValue({
        key: 'archivedYears',
        value: mockYears,
      });

      const result = await syncMetadataService.getArchivedYears();

      expect(result).toEqual(mockYears);
      expect(db.syncMetadata.get).toHaveBeenCalledWith('archivedYears');
    });
  });

  describe('setLastModified', () => {
    it('should set last modified timestamp', async () => {
      const timestamp = '2024-01-01T00:00:00.000Z';

      await syncMetadataService.setLastModified(timestamp);

      expect(db.syncMetadata.put).toHaveBeenCalledWith({ key: 'lastModified', value: timestamp });
    });
  });

  describe('getLastModified', () => {
    it('should return last modified timestamp', async () => {
      const timestamp = '2024-01-01T00:00:00.000Z';
      (db.syncMetadata.get as jest.Mock).mockResolvedValue({
        key: 'lastModified',
        value: timestamp,
      });

      const result = await syncMetadataService.getLastModified();

      expect(result).toBe(timestamp);
      expect(db.syncMetadata.get).toHaveBeenCalledWith('lastModified');
    });

    it('should return null if no timestamp set', async () => {
      (db.syncMetadata.get as jest.Mock).mockResolvedValue(undefined);

      const result = await syncMetadataService.getLastModified();

      expect(result).toBeNull();
      expect(db.syncMetadata.get).toHaveBeenCalledWith('lastModified');
    });
  });
});
