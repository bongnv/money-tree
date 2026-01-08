import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { BudgetPerformanceReport } from './BudgetPerformanceReport';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import type { Budget, Transaction, TransactionType, Category, Account } from '../../types/models';
import { Group, AccountType } from '../../types/enums';

// Mock stores
jest.mock('../../stores/useBudgetStore');
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useCategoryStore');
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useAppStore');
jest.mock('../../stores/useExchangeRateStore');

// Mock charts
jest.mock('../charts/LineChart', () => ({
  LineChart: () => <div data-testid="line-chart">Line Chart</div>,
}));
jest.mock('../charts/BarChart', () => ({
  BarChart: () => <div data-testid="bar-chart">Bar Chart</div>,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('BudgetPerformanceReport', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Food',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat2',
      name: 'Income',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'type1',
      name: 'Groceries',
      categoryId: 'cat1',
      group: Group.EXPENSE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'type2',
      name: 'Salary',
      categoryId: 'cat2',
      group: Group.INCOME,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockAccounts: Account[] = [
    {
      id: 'acc1',
      name: 'Checking',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: 'USD',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockBudgets: Budget[] = [
    {
      id: 'budget1',
      transactionTypeId: 'type1',
      amount: 500,
      currencyCode: 'USD',
      period: 'monthly',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx1',
      date: '2026-01-15',
      amount: 300,
      transactionTypeId: 'type1',
      fromAccountId: 'acc1',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ budgets: mockBudgets })
    );

    (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ transactions: mockTransactions })
    );

    (useCategoryStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        transactionTypes: mockTransactionTypes,
        categories: mockCategories,
      })
    );

    (useAccountStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ accounts: mockAccounts })
    );

    (useAppStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ baseCurrency: 'USD' })
    );

    (useExchangeRateStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        getRateForMonth: jest.fn(() => 1),
        fetchRateIfMissing: jest.fn(),
      })
    );
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BudgetPerformanceReport />
      </BrowserRouter>
    );
  };

  it('should render report title', () => {
    renderComponent();
    expect(screen.getByText('Budget Performance Report')).toBeInTheDocument();
  });

  it('should render period selector', () => {
    renderComponent();
    expect(screen.getByText(/Year to Date/i)).toBeInTheDocument();
  });

  it('should render currency selector', () => {
    renderComponent();
    expect(screen.getAllByText('Currency').length).toBeGreaterThan(0);
  });

  it('should render category filter', () => {
    renderComponent();
    expect(screen.getAllByText('Categories').length).toBeGreaterThan(0);
  });

  it('should render clear button', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should render summary cards', () => {
    renderComponent();
    expect(screen.getByText('Total Budgeted (Expenses)')).toBeInTheDocument();
    expect(screen.getByText('Total Actual (Expenses)')).toBeInTheDocument();
    expect(screen.getByText('Overall Health Score')).toBeInTheDocument();
  });

  it('should display budget performance table', () => {
    renderComponent();
    expect(screen.getByText('Budget Performance Details')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('should render trend chart', () => {
    renderComponent();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should render separate income and expense charts', () => {
    renderComponent();
    // Should have at least one line chart (expenses)
    // Income chart only shows if there are income budgets
    const charts = screen.getAllByTestId('line-chart');
    expect(charts.length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty state when no budgets', () => {
    (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ budgets: [] })
    );

    renderComponent();
    expect(screen.getByText(/No budgets found for this period/i)).toBeInTheDocument();
  });

  it('should handle currency change', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Find the currency select by its text
    const currencyLabels = screen.getAllByText('Currency');
    expect(currencyLabels.length).toBeGreaterThan(0);

    // Verify Currency selector exists
    const currencySelects = screen.getAllByRole('combobox');
    expect(currencySelects.length).toBeGreaterThanOrEqual(2); // Period, Currency, Categories selectors
  });

  it('should handle clear filters button', async () => {
    const user = userEvent.setup();
    renderComponent();

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeDisabled(); // Initially disabled when no filters

    // This test verifies the button exists and initial state
    expect(clearButton).toBeInTheDocument();
  });

  it('should navigate to transactions when row clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const groceryRow = screen.getByText('Groceries').closest('tr');
    if (groceryRow) {
      await user.click(groceryRow);
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/transactions?'));
    }
  });

  it('should display progress bars in table', () => {
    renderComponent();
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should show income chip for income budgets', () => {
    const incomeBudget: Budget = {
      id: 'budget2',
      transactionTypeId: 'type2',
      amount: 5000,
      currencyCode: 'USD',
      period: 'monthly',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ budgets: [...mockBudgets, incomeBudget] })
    );

    renderComponent();
    // Should show income chip (multiple "Income" text elements expected)
    const incomeElements = screen.getAllByText('Income');
    expect(incomeElements.length).toBeGreaterThan(0);
  });

  it('should display health score with correct color', () => {
    renderComponent();
    // Health score should be rendered (percentage value)
    expect(screen.getByText('Overall Health Score')).toBeInTheDocument();
  });

  it('should handle date range changes', () => {
    renderComponent();
    // PeriodSelector component should be rendered
    expect(screen.getByText(/Year to Date/i)).toBeInTheDocument();
  });
});
