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
    private dataFiles: Map<number, DataFile> = new Map();

    async loadDataFile(year: number): Promise<DataFile | null> {
      return this.dataFiles.get(year) || null;
    }

    async saveDataFile(year: number, data: DataFile): Promise<void> {
      this.dataFiles.set(year, data);
    }

    async listAvailableYears(): Promise<number[]> {
      return Array.from(this.dataFiles.keys()).sort((a, b) => b - a);
    }
  }

  let provider: IStorageProvider;
  let mockData: DataFile;

  beforeEach(() => {
    provider = new MockStorageProvider();
    mockData = {
      version: '1.0.0',
      year: 2024,
      accounts: [],
      categories: [],
      transactionTypes: [],
      transactions: [],
      budgets: [],
      manualAssets: [],
      lastModified: new Date().toISOString(),
    };
  });

  describe('loadDataFile', () => {
    it('should return null when file does not exist', async () => {
      const result = await provider.loadDataFile(2024);
      expect(result).toBeNull();
    });

    it('should return data when file exists', async () => {
      await provider.saveDataFile(2024, mockData);
      const result = await provider.loadDataFile(2024);
      expect(result).toEqual(mockData);
    });

    it('should return correct data for specific year', async () => {
      const data2023 = { ...mockData, year: 2023 };
      const data2024 = { ...mockData, year: 2024 };

      await provider.saveDataFile(2023, data2023);
      await provider.saveDataFile(2024, data2024);

      const result2023 = await provider.loadDataFile(2023);
      const result2024 = await provider.loadDataFile(2024);

      expect(result2023?.year).toBe(2023);
      expect(result2024?.year).toBe(2024);
    });
  });

  describe('saveDataFile', () => {
    it('should save data successfully', async () => {
      await provider.saveDataFile(2024, mockData);
      const result = await provider.loadDataFile(2024);
      expect(result).toEqual(mockData);
    });

    it('should overwrite existing data', async () => {
      await provider.saveDataFile(2024, mockData);

      const updatedData = { ...mockData, lastModified: new Date().toISOString() };
      await provider.saveDataFile(2024, updatedData);

      const result = await provider.loadDataFile(2024);
      expect(result).toEqual(updatedData);
    });

    it('should save data for multiple years independently', async () => {
      const data2023 = { ...mockData, year: 2023 };
      const data2024 = { ...mockData, year: 2024 };

      await provider.saveDataFile(2023, data2023);
      await provider.saveDataFile(2024, data2024);

      const result2023 = await provider.loadDataFile(2023);
      const result2024 = await provider.loadDataFile(2024);

      expect(result2023).toEqual(data2023);
      expect(result2024).toEqual(data2024);
    });
  });

  describe('listAvailableYears', () => {
    it('should return empty array when no files exist', async () => {
      const result = await provider.listAvailableYears();
      expect(result).toEqual([]);
    });

    it('should return single year when one file exists', async () => {
      await provider.saveDataFile(2024, mockData);
      const result = await provider.listAvailableYears();
      expect(result).toEqual([2024]);
    });

    it('should return multiple years sorted descending', async () => {
      await provider.saveDataFile(2022, { ...mockData, year: 2022 });
      await provider.saveDataFile(2024, { ...mockData, year: 2024 });
      await provider.saveDataFile(2023, { ...mockData, year: 2023 });

      const result = await provider.listAvailableYears();
      expect(result).toEqual([2024, 2023, 2022]);
    });
  });
});

