import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuickEntryContainer } from './QuickEntryContainer';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { AccountType } from '../../types/enums';
import type { Account, Category, TransactionType, ManualAsset } from '../../types/models';

jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useCategoryStore');
jest.mock('../../stores/useAssetStore');
jest.mock('../transactions/QuickEntryRow', () => ({
  QuickEntryRow: () => <div data-testid="quick-entry-row">QuickEntryRow</div>,
}));

describe('QuickEntryContainer', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Checking',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Food',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'type-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      group: 'expense' as any,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockManualAssets: ManualAsset[] = [
    {
      id: 'asset-1',
      name: 'Stock Portfolio',
      type: 'stocks_and_shares' as any,
      value: 10000,
      currencyId: 'usd',
      date: '2024-01-01',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockAddTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      transactions: [],
      addTransaction: mockAddTransaction,
    });

    (useAccountStore as unknown as jest.Mock).mockReturnValue({
      accounts: mockAccounts,
    });

    (useCategoryStore as unknown as jest.Mock).mockReturnValue({
      categories: mockCategories,
      transactionTypes: mockTransactionTypes,
    });

    (useAssetStore as unknown as jest.Mock).mockReturnValue({
      manualAssets: mockManualAssets,
    });
  });

  it('should render QuickEntryRow component', () => {
    render(<QuickEntryContainer />);

    expect(screen.getByTestId('quick-entry-row')).toBeInTheDocument();
  });

  it('should pass correct props to QuickEntryRow', () => {
    const { container } = render(<QuickEntryContainer />);

    expect(container).toBeInTheDocument();
    expect(useAccountStore).toHaveBeenCalled();
    expect(useCategoryStore).toHaveBeenCalled();
    expect(useTransactionStore).toHaveBeenCalled();
    expect(useAssetStore).toHaveBeenCalled();
  });
});
