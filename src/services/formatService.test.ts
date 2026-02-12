import { CurrencyCode, BudgetPeriod, Group, AccountType, AssetType } from '@/types/enums';
import type {
  Account,
  Category,
  TransactionType,
  Transaction,
  Budget,
  ManualAsset,
} from '@/types/models';
import { FormatService } from './formatService';

describe('FormatService', () => {
  let formatService: FormatService;

  beforeEach(() => {
    formatService = new FormatService();
  });

  describe('calculateDataSize', () => {
    const mockAccount: Account = {
      id: 'acc-1',
      name: 'Checking',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: 1000,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockCategory: Category = {
      id: 'cat-1',
      name: 'Food',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockTransactionType: TransactionType = {
      id: 'type-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      group: Group.EXPENSE,
      isActive: true,
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockTransaction: Transaction = {
      id: 'tx-1',
      date: '2024-01-15',
      transactionTypeId: 'type-1',
      description: 'Test',
      amount: 50,
      fromAccountId: 'acc-1',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockBudget: Budget = {
      id: 'budget-1',
      transactionTypeId: 'type-1',
      amount: 1000,
      currencyCode: CurrencyCode.USD,
      period: BudgetPeriod.MONTHLY,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockAsset: ManualAsset = {
      id: 'asset-1',
      name: 'Investment',
      type: AssetType.STOCKS_AND_SHARES,
      currencyCode: CurrencyCode.USD,
      valueHistory: [{ date: '2024-01-01', value: 10000 }],
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should return "Loading..." when any data is undefined', () => {
      expect(
        formatService.calculateDataSize({
          accounts: undefined,
          categories: [mockCategory],
          transactionTypes: [mockTransactionType],
          transactions: [mockTransaction],
          budgets: [mockBudget],
          assets: [mockAsset],
        })
      ).toBe('Loading...');

      expect(
        formatService.calculateDataSize({
          accounts: [mockAccount],
          categories: undefined,
          transactionTypes: [mockTransactionType],
          transactions: [mockTransaction],
          budgets: [mockBudget],
          assets: [mockAsset],
        })
      ).toBe('Loading...');

      expect(
        formatService.calculateDataSize({
          accounts: [mockAccount],
          categories: [mockCategory],
          transactionTypes: undefined,
          transactions: [mockTransaction],
          budgets: [mockBudget],
          assets: [mockAsset],
        })
      ).toBe('Loading...');

      expect(
        formatService.calculateDataSize({
          accounts: [mockAccount],
          categories: [mockCategory],
          transactionTypes: [mockTransactionType],
          transactions: undefined,
          budgets: [mockBudget],
          assets: [mockAsset],
        })
      ).toBe('Loading...');

      expect(
        formatService.calculateDataSize({
          accounts: [mockAccount],
          categories: [mockCategory],
          transactionTypes: [mockTransactionType],
          transactions: [mockTransaction],
          budgets: undefined,
          assets: [mockAsset],
        })
      ).toBe('Loading...');

      expect(
        formatService.calculateDataSize({
          accounts: [mockAccount],
          categories: [mockCategory],
          transactionTypes: [mockTransactionType],
          transactions: [mockTransaction],
          budgets: [mockBudget],
          assets: undefined,
        })
      ).toBe('Loading...');
    });

    it('should return size in bytes for very small data', () => {
      const result = formatService.calculateDataSize({
        accounts: [],
        categories: [],
        transactionTypes: [],
        transactions: [],
        budgets: [],
        assets: [],
      });

      expect(result).toMatch(/bytes$/);
    });

    it('should return size in KB for medium data', () => {
      // Generate enough data to exceed 1024 bytes
      const manyTransactions = Array.from({ length: 20 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        description: `Transaction number ${i} with a reasonably long description to add some size`,
      }));

      const result = formatService.calculateDataSize({
        accounts: [mockAccount],
        categories: [mockCategory],
        transactionTypes: [mockTransactionType],
        transactions: manyTransactions,
        budgets: [mockBudget],
        assets: [mockAsset],
      });

      expect(result).toMatch(/KB$/);
    });

    it('should return size in MB for large data', () => {
      // Generate lots of data to exceed 1 MB
      const manyTransactions = Array.from({ length: 5000 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        description: `Transaction number ${i} with a very long description to make the data large enough to exceed one megabyte in size when serialized to JSON format`,
      }));

      const result = formatService.calculateDataSize({
        accounts: [mockAccount],
        categories: [mockCategory],
        transactionTypes: [mockTransactionType],
        transactions: manyTransactions,
        budgets: [mockBudget],
        assets: [mockAsset],
      });

      expect(result).toMatch(/MB$/);
    });

    it('should return formatted file size for complete data', () => {
      const result = formatService.calculateDataSize({
        accounts: [mockAccount],
        categories: [mockCategory],
        transactionTypes: [mockTransactionType],
        transactions: [mockTransaction],
        budgets: [mockBudget],
        assets: [mockAsset],
      });

      // Should be a valid size string
      expect(result).toMatch(/^\d+(\.\d+)?\s*(bytes|KB|MB)$/);
    });
  });
});
