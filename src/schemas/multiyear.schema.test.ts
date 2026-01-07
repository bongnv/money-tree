import {
  YearEndSummarySchema,
  ArchivedYearReferenceSchema,
  DataFileSchema,
  ArchiveFileSchema,
} from './models.schema';

describe('Multi-Year Schemas', () => {
  describe('YearEndSummarySchema', () => {
    it('should validate a valid year-end summary', () => {
      const validSummary = {
        transactionCount: 100,
        closingNetWorth: 50000,
        closingBalances: {
          'account-1': 10000,
          'account-2': 40000,
        },
        closingAssetValuations: {},
      };

      const result = YearEndSummarySchema.safeParse(validSummary);
      expect(result.success).toBe(true);
    });

    it('should reject negative transaction count', () => {
      const invalidSummary = {
        transactionCount: -1,
        closingNetWorth: 50000,
        closingBalances: {},
        closingAssetValuations: {},
      };

      const result = YearEndSummarySchema.safeParse(invalidSummary);
      expect(result.success).toBe(false);
    });

    it('should allow negative net worth', () => {
      const validSummary = {
        transactionCount: 50,
        closingNetWorth: -5000,
        closingBalances: {},
        closingAssetValuations: {},
      };

      const result = YearEndSummarySchema.safeParse(validSummary);
      expect(result.success).toBe(true);
    });
  });

  describe('ArchivedYearReferenceSchema', () => {
    it('should validate a valid archived year reference', () => {
      const validReference = {
        year: 2025,
        archivedDate: '2026-01-01T00:00:00.000Z',
        summary: {
          transactionCount: 100,
          closingNetWorth: 50000,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      const result = ArchivedYearReferenceSchema.safeParse(validReference);
      expect(result.success).toBe(true);
    });

    it('should reject invalid year', () => {
      const invalidReference = {
        year: 1800,
        archivedDate: '2026-01-01T00:00:00.000Z',
        summary: {
          transactionCount: 0,
          closingNetWorth: 0,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      const result = ArchivedYearReferenceSchema.safeParse(invalidReference);
      expect(result.success).toBe(false);
    });
  });

  describe('DataFileSchema', () => {
    it('should validate a valid data file with flat arrays', () => {
      const validFile = {
        version: '2.0.0',
        transactions: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        accounts: [],
        categories: [],
        transactionTypes: [],
        archivedYears: [],
        lastModified: '2026-01-03T00:00:00.000Z',
      };

      const result = DataFileSchema.safeParse(validFile);
      expect(result.success).toBe(true);
    });

    it('should validate file with archived years', () => {
      const fileWithArchives = {
        version: '2.0.0',
        transactions: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        accounts: [],
        categories: [],
        transactionTypes: [],
        archivedYears: [
          {
            year: 2025,
            fileName: 'money-tree-2025.json',
            archivedDate: '2026-01-01T00:00:00.000Z',
            summary: {
              transactionCount: 100,
              closingNetWorth: 50000,
              closingBalances: {},
              closingAssetValuations: {},
            },
          },
        ],
        lastModified: '2026-01-03T00:00:00.000Z',
      };

      const result = DataFileSchema.safeParse(fileWithArchives);
      expect(result.success).toBe(true);
    });

    it('should handle null arrays', () => {
      const fileWithNulls = {
        version: '2.0.0',
        transactions: null,
        budgets: null,
        manualAssets: null,
        exchangeRates: null,
        accounts: null,
        categories: null,
        transactionTypes: null,
        archivedYears: null,
        lastModified: '2026-01-03T00:00:00.000Z',
      };

      const result = DataFileSchema.safeParse(fileWithNulls);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transactions).toEqual([]);
        expect(result.data.budgets).toEqual([]);
        expect(result.data.manualAssets).toEqual([]);
        expect(result.data.exchangeRates).toEqual([]);
        expect(result.data.accounts).toEqual([]);
        expect(result.data.categories).toEqual([]);
        expect(result.data.transactionTypes).toEqual([]);
        expect(result.data.archivedYears).toEqual([]);
      }
    });
  });

  describe('ArchiveFileSchema', () => {
    it('should validate a valid archive file', () => {
      const validArchive = {
        version: '2.0.0',
        year: 2025,
        accounts: [],
        categories: [],
        transactionTypes: [],
        transactions: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        archivedDate: '2026-01-01T00:00:00.000Z',
        summary: {
          transactionCount: 100,
          closingNetWorth: 50000,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      const result = ArchiveFileSchema.safeParse(validArchive);
      expect(result.success).toBe(true);
    });

    it('should reject archive without summary', () => {
      const invalidArchive = {
        version: '2.0.0',
        year: 2025,
        accounts: [],
        categories: [],
        transactionTypes: [],
        transactions: [],
        budgets: [],
        manualAssets: [],
        archivedDate: '2026-01-01T00:00:00.000Z',
      };

      const result = ArchiveFileSchema.safeParse(invalidArchive);
      expect(result.success).toBe(false);
    });

    it('should reject archive with invalid year', () => {
      const invalidArchive = {
        version: '2.0.0',
        year: 1800,
        accounts: [],
        categories: [],
        transactionTypes: [],
        transactions: [],
        budgets: [],
        manualAssets: [],
        exchangeRates: [],
        archivedDate: '2026-01-01T00:00:00.000Z',
        summary: {
          transactionCount: 0,
          closingNetWorth: 0,
          closingBalances: {},
          closingAssetValuations: {},
        },
      };

      const result = ArchiveFileSchema.safeParse(invalidArchive);
      expect(result.success).toBe(false);
    });
  });
});
