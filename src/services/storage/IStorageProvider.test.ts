import type { IStorageProvider } from './IStorageProvider';
import type { DataFile } from '../../types/models';

/**
 * Tests for IStorageProvider interface
 * These tests verify that implementations follow the contract
 */
describe('IStorageProvider', () => {
  /**
   * Mock implementation for testing
   */
  class MockStorageProvider implements IStorageProvider {
    private dataFile: DataFile | null = null;

    async loadDataFile(): Promise<DataFile | null> {
      return this.dataFile;
    }

    async saveDataFile(data: DataFile): Promise<void> {
      this.dataFile = data;
    }
  }

  let provider: IStorageProvider;
  let mockData: DataFile;

  beforeEach(() => {
    provider = new MockStorageProvider();
    mockData = {
      version: '1.0.0',
      years: {
        '2024': {
          transactions: [],
          budgets: [],
          manualAssets: [],
        },
      },
      accounts: [],
      categories: [],
      transactionTypes: [],
      archivedYears: [],
      lastModified: new Date().toISOString(),
    };
  });

  describe('loadDataFile', () => {
    it('should return null when file does not exist', async () => {
      const result = await provider.loadDataFile();
      expect(result).toBeNull();
    });

    it('should return data when file exists', async () => {
      await provider.saveDataFile(mockData);
      const result = await provider.loadDataFile();
      expect(result).toEqual(mockData);
    });

    it('should return data with multiple years', async () => {
      const multiYearData = {
        ...mockData,
        years: {
          '2023': { transactions: [], budgets: [], manualAssets: [] },
          '2024': { transactions: [], budgets: [], manualAssets: [] },
        },
      };

      await provider.saveDataFile(multiYearData);
      const result = await provider.loadDataFile();

      expect(result?.years).toHaveProperty('2023');
      expect(result?.years).toHaveProperty('2024');
    });
  });

  describe('saveDataFile', () => {
    it('should save data successfully', async () => {
      await provider.saveDataFile(mockData);
      const result = await provider.loadDataFile();
      expect(result).toEqual(mockData);
    });

    it('should overwrite existing data', async () => {
      await provider.saveDataFile(mockData);

      const updatedData = { ...mockData, lastModified: new Date().toISOString() };
      await provider.saveDataFile(updatedData);

      const result = await provider.loadDataFile();
      expect(result).toEqual(updatedData);
    });

    it('should save data with multiple years', async () => {
      const multiYearData = {
        ...mockData,
        years: {
          '2023': { transactions: [], budgets: [], manualAssets: [] },
          '2024': { transactions: [], budgets: [], manualAssets: [] },
        },
      };

      await provider.saveDataFile(multiYearData);
      const result = await provider.loadDataFile();

      expect(result?.years).toHaveProperty('2023');
      expect(result?.years).toHaveProperty('2024');
    });
  });
});
