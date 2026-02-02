import { render } from '@testing-library/react';
import { TransactionForm } from './TransactionForm';
import { useTransactionForm } from '@/hooks/transactions/useTransactionForm';
import { useAssets } from '../../hooks/useAssets';
import type { Transaction, Account, TransactionType, Category } from '../../types/models';
import { AccountType, Group, CurrencyCode } from '../../types/enums';

jest.mock('@/hooks/transactions/useTransactionForm');
jest.mock('../../hooks/useAssets');

const mockUseTransactionForm = useTransactionForm as jest.MockedFunction<typeof useTransactionForm>;
const mockUseAssets = useAssets as jest.MockedFunction<typeof useAssets>;

describe('TransactionForm', () => {
  const mockAccount: Account = {
    id: 'account-1',
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
    id: 'category-1',
    name: 'Food',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTransactionType: TransactionType = {
    id: 'type-1',
    name: 'Groceries',
    categoryId: 'category-1',
    group: Group.EXPENSE,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTransaction: Transaction = {
    id: 'tx-1',
    date: '2024-01-15',
    amount: 50,
    transactionTypeId: 'type-1',
    fromAccountId: 'account-1',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockSetField = jest.fn();
  const mockHandleSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAssets.mockReturnValue([]);
    
    mockUseTransactionForm.mockReturnValue({
      formData: {
        date: '2024-01-15',
        amount: '0',
        description: '',
        transactionTypeId: '',
        fromAccountId: '',
        toAccountId: '',
        fromAssetId: '',
        toAssetId: '',
      },
      errors: {},
      setField: mockSetField,
      handleSubmit: mockHandleSubmit,
    });
  });

  it('should render form without crashing', () => {
    const { container } = render(
      <TransactionForm
        accounts={[mockAccount]}
        categories={[mockCategory]}
        transactionTypes={[mockTransactionType]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('should render with transaction data', () => {
    mockUseTransactionForm.mockReturnValue({
      formData: {
        date: mockTransaction.date,
        amount: String(mockTransaction.amount),
        description: mockTransaction.description || '',
        transactionTypeId: mockTransaction.transactionTypeId,
        fromAccountId: mockTransaction.fromAccountId || '',
        toAccountId: mockTransaction.toAccountId || '',
        fromAssetId: mockTransaction.fromAssetId || '',
        toAssetId: mockTransaction.toAssetId || '',
      },
      errors: {},
      setField: mockSetField,
      handleSubmit: mockHandleSubmit,
    });

    const { container } = render(
      <TransactionForm
        transaction={mockTransaction}
        accounts={[mockAccount]}
        categories={[mockCategory]}
        transactionTypes={[mockTransactionType]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('should use transaction form hook', () => {
    render(
      <TransactionForm
        accounts={[mockAccount]}
        categories={[mockCategory]}
        transactionTypes={[mockTransactionType]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(mockUseTransactionForm).toHaveBeenCalled();
  });

  it('should handle empty categories', () => {
    const { container } = render(
      <TransactionForm
        accounts={[mockAccount]}
        categories={[]}
        transactionTypes={[mockTransactionType]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('should handle empty accounts', () => {
    const { container } = render(
      <TransactionForm
        accounts={[]}
        categories={[mockCategory]}
        transactionTypes={[mockTransactionType]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('should handle empty transaction types', () => {
    const { container } = render(
      <TransactionForm
        accounts={[mockAccount]}
        categories={[mockCategory]}
        transactionTypes={[]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(container).toBeInTheDocument();
  });
});
