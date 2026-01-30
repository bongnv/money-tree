import type { IStorageProvider, CloudItem } from './IStorageProvider';
import type { DataFile } from '../../types/models';
import { CurrencyCode } from '@/types/enums';

/**
 * Tests for IStorageProvider interface
 * These tests verify that implementations follow the contract
 */
describe('IStorageProvider', () => {
  /**
   * Mock implementation for testing
   */
  class MockStorageProvider implements IStorageProvider {
    private fileContent: string | null = null;

    async initialize(): Promise<boolean> {
      return true;
    }

    async authenticate(): Promise<void> {
      // Mock authentication
    }

    async readFile(_fileItem: CloudItem): Promise<Blob> {
      if (!this.fileContent) {
        throw new Error('File not found');
      }
      return new Blob([this.fileContent], { type: 'application/json' });
    }

    async writeFile(_fileItem: CloudItem, content: Blob): Promise<CloudItem> {
      // Read Blob content using FileReader in test environment
      const reader = new FileReader();
      this.fileContent = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(content);
      });
      return { id: 'mock-id', name: 'mock-file.json', isFolder: false };
    }

    getName(): string {
      return 'Mock Provider';
    }

    async listItems(_parent?: CloudItem): Promise<CloudItem[]> {
      return [];
    }
  }

  let provider: IStorageProvider;
  let mockData: DataFile;
  let fileItem: CloudItem;

  beforeEach(() => {
    provider = new MockStorageProvider();
    fileItem = { id: 'test-id', name: 'test-file.json', isFolder: false };
    mockData = {
      version: '1.0',
      transactions: [],
      accounts: [],
      categories: [],
      transactionTypes: [],
      budgets: [],
      manualAssets: [],
      exchangeRates: [],
      archivedYears: [],
      baseCurrency: CurrencyCode.USD,
      lastModified: new Date().toISOString(),
    };
  });

  describe('readFile', () => {
    it('should throw error when file does not exist', async () => {
      await expect(provider.readFile(fileItem)).rejects.toThrow('File not found');
    });

    it('should return Blob when file exists', async () => {
      const content = new Blob([JSON.stringify(mockData)], { type: 'application/json' });
      await provider.writeFile(fileItem, content);

      const result = await provider.readFile(fileItem);
      expect(result).toBeInstanceOf(Blob);

      // Read blob using FileReader for test environment
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(result);
      });
      expect(JSON.parse(text)).toEqual(mockData);
    });
  });

  describe('writeFile', () => {
    it('should write data successfully', async () => {
      const content = new Blob([JSON.stringify(mockData)], { type: 'application/json' });
      const result = await provider.writeFile(fileItem, content);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');

      const readBlob = await provider.readFile(fileItem);
      const readText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(readBlob);
      });
      expect(JSON.parse(readText)).toEqual(mockData);
    });

    it('should overwrite existing data', async () => {
      const content1 = new Blob([JSON.stringify(mockData)], { type: 'application/json' });
      await provider.writeFile(fileItem, content1);

      const updatedData = { ...mockData, lastModified: new Date().toISOString() };
      const content2 = new Blob([JSON.stringify(updatedData)], { type: 'application/json' });
      await provider.writeFile(fileItem, content2);

      const result = await provider.readFile(fileItem);
      const resultText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(result);
      });
      expect(JSON.parse(resultText)).toEqual(updatedData);
    });
  });
});
