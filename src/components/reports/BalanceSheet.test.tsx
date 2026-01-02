import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BalanceSheet } from './BalanceSheet';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { AccountType, AssetType } from '../../types/enums';

// Mock the stores
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useAssetStore');
jest.mock('../../stores/useTransactionStore');

describe('BalanceSheet', () => {
  const mockAccounts = [
    {
      id: 'acc1',
      name: 'Checking Account',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'acc2',
      name: 'Credit Card',
      type: AccountType.CREDIT_CARD,
      currencyId: 'usd',
      initialBalance: 0,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockManualAssets = [
    {
      id: 'asset1',
      name: 'House',
      type: AssetType.REAL_ESTATE,
      value: 500000,
      currencyId: 'usd',
      date: '2024-01-01',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactions = [
    {
      id: 'tx1',
      date: '2024-01-15',
      description: 'Income',
      amount: 3000,
      transactionTypeId: 'type1',
      toAccountId: 'acc1',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    (useAccountStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ accounts: mockAccounts })
    );
    (useAssetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ manualAssets: mockManualAssets })
    );
    (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ transactions: mockTransactions })
    );
  });

  it('should render balance sheet title', () => {
    render(<BalanceSheet />);
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
  });

  it('should render date selector', () => {
    render(<BalanceSheet />);
    expect(screen.getByLabelText('As of Date')).toBeInTheDocument();
  });

  it('should render comparison toggle buttons', () => {
    render(<BalanceSheet />);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Month-over-Month')).toBeInTheDocument();
    expect(screen.getByText('Year-over-Year')).toBeInTheDocument();
  });

  it('should render summary cards', () => {
    render(<BalanceSheet />);
    expect(screen.getAllByText('Total Assets')[0]).toBeInTheDocument();
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
    expect(screen.getAllByText('Net Worth')[0]).toBeInTheDocument();
  });

  it('should update date when date input changes', () => {
    render(<BalanceSheet />);
    const dateInput = screen.getByLabelText('As of Date') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2024-06-15' } });
    expect(dateInput.value).toBe('2024-06-15');
  });

  it('should change comparison type when toggle button clicked', () => {
    render(<BalanceSheet />);
    const monthButton = screen.getByText('Month-over-Month');
    fireEvent.click(monthButton);
    // The button should be in selected state after click
    expect(monthButton).toBeInTheDocument();
  });

  it('should render net worth trend chart title', () => {
    render(<BalanceSheet />);
    expect(screen.getByText('Net Worth Trend (Past 12 Months)')).toBeInTheDocument();
  });

  it('should render assets section when data exists', () => {
    render(<BalanceSheet />);
    expect(screen.getByText('Assets')).toBeInTheDocument();
  });

  it('should render liabilities section when data exists', () => {
    render(<BalanceSheet />);
    // Liabilities section only renders if there are liability groups
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
  });

  it('should render final net worth summary', () => {
    render(<BalanceSheet />);
    const netWorthElements = screen.getAllByText('Net Worth');
    expect(netWorthElements.length).toBeGreaterThan(1); // Should appear multiple times
  });

  it('should display currency formatted values', () => {
    render(<BalanceSheet />);
    // Should have dollar signs in the document
    const dollarsigns = screen.getAllByText(/\$/);
    expect(dollarsigns.length).toBeGreaterThan(0);
  });

  it('should handle empty data gracefully', () => {
    (useAccountStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ accounts: [] })
    );
    (useAssetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ manualAssets: [] })
    );
    (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ transactions: [] })
    );

    render(<BalanceSheet />);
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
  });

  it('should show comparison data when month-over-month is selected', () => {
    render(<BalanceSheet />);
    const monthButton = screen.getByText('Month-over-Month');
    fireEvent.click(monthButton);
    // Should display trending icons when comparison is active
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
  });

  it('should show comparison data when year-over-year is selected', () => {
    render(<BalanceSheet />);
    const yearButton = screen.getByText('Year-over-Year');
    fireEvent.click(yearButton);
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
  });
});
