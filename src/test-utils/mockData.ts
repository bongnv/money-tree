import { AccountType, Group, CurrencyCode, AssetType } from '../types/enums';
import type {
  Account,
  Transaction,
  Category,
  TransactionType,
  Budget,
  ManualAsset,
} from '../types/models';

/**
 * Test utilities for mocking Dexie hooks
 * Usage in test files:
 *
 * jest.mock('../../hooks/queries/useAccounts');
 * (useAccounts as jest.Mock).mockReturnValue(mockAccounts);
 */

export const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Checking Account',
    type: AccountType.BANK_ACCOUNT,
    currencyCode: CurrencyCode.USD,
    initialBalance: 1000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'acc-2',
    name: 'Savings Account',
    type: AccountType.BANK_ACCOUNT,
    currencyCode: CurrencyCode.USD,
    initialBalance: 5000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Food & Dining',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-2',
    name: 'Income',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export const mockTransactionTypes: TransactionType[] = [
  {
    id: 'tt-1',
    name: 'Groceries',
    categoryId: 'cat-1',
    group: Group.EXPENSE,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tt-2',
    name: 'Salary',
    categoryId: 'cat-2',
    group: Group.INCOME,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    date: '2024-01-15',
    description: 'Grocery shopping',
    amount: 50.25,
    transactionTypeId: 'tt-1',
    fromAccountId: 'acc-1',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'tx-2',
    date: '2024-01-01',
    description: 'Monthly salary',
    amount: 5000,
    transactionTypeId: 'tt-2',
    toAccountId: 'acc-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export const mockBudgets: Budget[] = [
  {
    id: 'budget-1',
    transactionTypeId: 'tt-1',
    amount: 500,
    period: 'monthly' as const,
    currencyCode: CurrencyCode.USD,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export const mockAssets: ManualAsset[] = [
  {
    id: 'asset-1',
    name: 'House',
    type: AssetType.REAL_ESTATE,
    currencyCode: CurrencyCode.USD,
    valueHistory: [{ date: '2024-01-01', value: 500000 }],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export const mockAppContext = {
  shouldShowWelcome: false,
  setShouldShowWelcome: jest.fn(),
  showSnackbar: jest.fn(),
  isLoading: false,
  setLoading: jest.fn(),
  isSyncing: false,
  setIsSyncing: jest.fn(),
  snackbar: { open: false, message: '', severity: 'info' as const },
  hideSnackbar: jest.fn(),
};

/**
 * Mock mutations with jest.fn() spies
 */
export const mockAccountMutations = {
  addAccount: jest.fn(),
  updateAccount: jest.fn(),
  deleteAccount: jest.fn(),
};

export const mockTransactionMutations = {
  addTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
};

export const mockCategoryMutations = {
  addCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  archiveCategory: jest.fn(),
  unarchiveCategory: jest.fn(),
};

export const mockTransactionTypeMutations = {
  addTransactionType: jest.fn(),
  updateTransactionType: jest.fn(),
  deleteTransactionType: jest.fn(),
  archiveTransactionType: jest.fn(),
  unarchiveTransactionType: jest.fn(),
};

export const mockBudgetMutations = {
  addBudget: jest.fn(),
  updateBudget: jest.fn(),
  deleteBudget: jest.fn(),
};

export const mockAssetMutations = {
  addAsset: jest.fn(),
  updateAsset: jest.fn(),
  deleteAsset: jest.fn(),
  updateAssetValue: jest.fn(),
};

/**
 * Helper to reset all mock functions
 */
export function resetAllMocks() {
  jest.clearAllMocks();
}
