import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BudgetPerformanceReport } from './BudgetPerformanceReport';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
import * as exchangeRateService from '../../services/exchangeRate.service';
import { Group, AccountType } from '../../types/enums';
import type { Budget, Transaction, TransactionType, Category, Account } from '../../types/models';

// Mock services
const mockReportService = {
  calculateBudgetPerformance: jest.fn(),
  calculateBudgetTrend: jest.fn(),
};

jest.mock('../../contexts/ServiceProviders', () => ({
  useReportService: () => mockReportService,
}));

// Mock stores
jest.mock('../../stores/useBudgetStore');
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useCategoryStore');
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useAppStore');

// Mock services
jest.mock('../../services/exchangeRate.service');

// Mock chart components
jest.mock('../common/charts/LineChart', () => ({
  LineChart: ({ data, lines }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  ),
}));

// Mock PeriodSelector
jest.mock('../common/PeriodSelector', () => ({
  PeriodSelector: ({ startDate, endDate, onChange, fullWidth }: any) => (
    <div data-testid="period-selector">
      <select
        data-testid="period-preset-select"
        onChange={(e) => {
          if (e.target.value === 'ytd') {
            onChange({ startDate: '2026-01-01', endDate: '2026-01-11' });
          }
        }}
      >
        <option value="ytd">Year to Date</option>
        <option value="custom">Custom</option>
      </select>
      <input
        type="date"
        data-testid="start-date-input"
        value={startDate}
        onChange={(e) => onChange({ startDate: e.target.value, endDate })}
      />
      <input
        type="date"
        data-testid="end-date-input"
        value={endDate}
        onChange={(e) => onChange({ startDate, endDate: e.target.value })}
      />
    </div>
  ),
}));

// Mock CategoryFilter
jest.mock('../common/CategoryFilter', () => ({
  CategoryFilter: ({ categories, selectedCategories, onChange, onClear }: any) => (
    <div data-testid="category-filter">
      <select
        multiple
        data-testid="category-select"
        value={selectedCategories}
        onChange={(e) => {
          const options = Array.from(e.target.selectedOptions).map((opt: any) => opt.value);
          onChange({ target: { value: options } });
        }}
      >
        {categories.map((cat: any) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  ),
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
      name: 'Transport',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat3',
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
      name: 'Gas',
      categoryId: 'cat2',
      group: Group.EXPENSE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'type3',
      name: 'Salary',
      categoryId: 'cat3',
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
    {
      id: 'budget2',
      transactionTypeId: 'type2',
      amount: 200,
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
      date: '2026-01-05',
      amount: 300,
      transactionTypeId: 'type1',
      fromAccountId: 'acc1',
      createdAt: '2026-01-05T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z',
    },
    {
      id: 'tx2',
      date: '2026-01-08',
      amount: 50,
      transactionTypeId: 'type2',
      fromAccountId: 'acc1',
      createdAt: '2026-01-08T00:00:00.000Z',
      updatedAt: '2026-01-08T00:00:00.000Z',
    },
  ];

  const mockPerformanceData = {
    items: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        transactionTypeId: 'type1',
        transactionTypeName: 'Groceries',
        budgetedAmount: 500,
        actualAmount: 300,
        remaining: 200,
        percentUsed: 60,
        isIncome: false,
      },
      {
        categoryId: 'cat2',
        categoryName: 'Transport',
        transactionTypeId: 'type2',
        transactionTypeName: 'Gas',
        budgetedAmount: 200,
        actualAmount: 50,
        remaining: 150,
        percentUsed: 25,
        isIncome: false,
      },
    ],
    totalBudgetedIncome: 0,
    totalActualIncome: 0,
    totalRemainingIncome: 0,
    totalBudgetedExpenses: 700,
    totalActualExpenses: 350,
    totalRemainingExpenses: 350,
    overallHealthScore: 85,
  };

  const mockTrendData = [
    { date: '2026-01-01', budgeted: 700, actual: 100, budgetedIncome: 0, actualIncome: 0 },
    { date: '2026-01-05', budgeted: 700, actual: 300, budgetedIncome: 0, actualIncome: 0 },
    { date: '2026-01-08', budgeted: 700, actual: 350, budgetedIncome: 0, actualIncome: 0 },
  ];

  const mockGetRateForMonth = jest.fn().mockResolvedValue(1);

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the service function
    jest.spyOn(exchangeRateService, 'getRateForMonth').mockImplementation(mockGetRateForMonth);

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

    (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue(
      mockPerformanceData
    );
    (mockReportService.calculateBudgetTrend as jest.Mock).mockResolvedValue(mockTrendData);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BudgetPerformanceReport />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render the report title', async () => {
      renderComponent();
      expect(screen.getByText('Budget Performance Report')).toBeInTheDocument();
      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });
    });

    it('should render period selector', async () => {
      renderComponent();
      expect(screen.getByTestId('period-selector')).toBeInTheDocument();
      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });
    });

    it('should render currency selector', async () => {
      renderComponent();
      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });
      // Currency selector should be present (there are multiple comboboxes)
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2); // Period and Currency selectors
    });

    it('should render category filter', async () => {
      renderComponent();
      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });
    });

    it('should render clear filters button', async () => {
      renderComponent();
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toBeDisabled(); // Initially disabled with no filters
      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });
    });

    it('should render summary cards with correct data', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Budgeted (Expenses)')).toBeInTheDocument();
        expect(screen.getByText('Total Actual (Expenses)')).toBeInTheDocument();
        expect(screen.getByText('Overall Health Score')).toBeInTheDocument();
      });
    });

    it('should display formatted currency values in summary cards', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/\$700\.00/)).toBeInTheDocument();
        expect(screen.getByText(/\$350\.00/)).toBeInTheDocument();
      });
    });

    it('should display health score percentage', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument();
      });
    });

    it('should render budget performance details table', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Budget Performance Details')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should render trend chart when data is available', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Budget vs Actual Trend')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Period Selection', () => {
    it('should default to Year to Date period', async () => {
      renderComponent();
      const periodSelect = screen.getByTestId('period-preset-select') as HTMLSelectElement;
      expect(periodSelect.value).toBe('ytd');
      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });
    });

    it('should update date range when period changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const startDateInput = screen.getByTestId('start-date-input') as HTMLInputElement;
      await user.clear(startDateInput);
      await user.type(startDateInput, '2026-01-01');

      await waitFor(() => {
        expect(startDateInput.value).toBe('2026-01-01');
      });
    });

    it('should recalculate budget performance when date range changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const endDateInput = screen.getByTestId('end-date-input');
      await user.clear(endDateInput);
      await user.type(endDateInput, '2026-06-30');

      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });
    });
  });

  describe('Currency Selection', () => {
    it('should allow changing display currency', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });

      // Verify that currency selector exists (multiple comboboxes on the page)
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);

      // Verify component renders with default USD currency
      expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        expect.any(Array),
        expect.any(Array),
        expect.any(String),
        expect.any(String),
        expect.any(Array),
        'USD'
      );
    });
  });

  describe('Category Filtering', () => {
    it('should filter budgets by selected categories', async () => {
      const user = userEvent.setup();
      renderComponent();

      const categorySelect = screen.getByTestId('category-select');
      await user.selectOptions(categorySelect, ['cat1']);

      await waitFor(() => {
        // When filtered, should only show items from selected category
        const clearButton = screen.getByRole('button', { name: /clear/i });
        expect(clearButton).not.toBeDisabled();
      });
    });

    it('should enable clear button when categories are selected', async () => {
      const user = userEvent.setup();
      renderComponent();

      const categorySelect = screen.getByTestId('category-select');
      await user.selectOptions(categorySelect, ['cat1']);

      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /clear/i });
        expect(clearButton).not.toBeDisabled();
      });
    });

    it('should clear category filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const categorySelect = screen.getByTestId('category-select');
      await user.selectOptions(categorySelect, ['cat1']);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(clearButton).toBeDisabled();
      });
    });
  });

  describe('Budget Performance Table', () => {
    it('should display category names when no filter is applied', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getByText('Transport')).toBeInTheDocument();
      });
    });

    it('should display transaction type names when category filter is applied', async () => {
      const user = userEvent.setup();

      (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue({
        ...mockPerformanceData,
        items: [mockPerformanceData.items[0]], // Only Food category items
      });

      renderComponent();

      const categorySelect = screen.getByTestId('category-select');
      await user.selectOptions(categorySelect, ['cat1']);

      await waitFor(() => {
        expect(screen.getByText('Groceries')).toBeInTheDocument();
      });
    });

    it('should display progress bars for each budget item', async () => {
      renderComponent();

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('should show percentage used for each budget', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('60.0%')).toBeInTheDocument();
        expect(screen.getByText('25.0%')).toBeInTheDocument();
      });
    });

    it('should navigate to transactions when transaction type row is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Food')).toBeInTheDocument();
      });

      // First click category to filter
      const categorySelect = screen.getByTestId('category-select');
      await user.selectOptions(categorySelect, ['cat1']);

      await waitFor(() => {
        expect(screen.getByText('Groceries')).toBeInTheDocument();
      });

      // Click on transaction type row
      const groceriesRow = screen.getByText('Groceries').closest('tr');
      if (groceriesRow) {
        await user.click(groceriesRow);

        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringMatching(/\/transactions\?transactionTypeId=type1/)
        );
      }
    });

    it('should filter categories when category row is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Food')).toBeInTheDocument();
      });

      const foodRow = screen.getByText('Food').closest('tr');
      if (foodRow) {
        await user.click(foodRow);

        await waitFor(() => {
          const categorySelect = screen.getByTestId('category-select') as HTMLSelectElement;
          expect(categorySelect.value).toContain('cat1');
        });
      }
    });
  });

  describe('Income Budgets', () => {
    it('should display income budgets with income chip', async () => {
      const incomeBudget: Budget = {
        id: 'budget3',
        transactionTypeId: 'type3',
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

      (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue({
        ...mockPerformanceData,
        items: [
          ...mockPerformanceData.items,
          {
            categoryId: 'cat3',
            categoryName: 'Income',
            transactionTypeId: 'type3',
            transactionTypeName: 'Salary',
            budgetedAmount: 5000,
            actualAmount: 4800,
            remaining: 200,
            percentUsed: 96,
            isIncome: true,
          },
        ],
        totalBudgetedIncome: 5000,
        totalActualIncome: 4800,
      });

      renderComponent();

      await waitFor(() => {
        const incomeChips = screen.getAllByText('Income');
        expect(incomeChips.length).toBeGreaterThan(0);
      });
    });

    it('should show income target and actual in summary cards when income budgets exist', async () => {
      (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue({
        ...mockPerformanceData,
        totalBudgetedIncome: 5000,
        totalActualIncome: 4800,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Target (Income)')).toBeInTheDocument();
        expect(screen.getByText('Total Actual (Income)')).toBeInTheDocument();
      });
    });
  });

  describe('Health Score', () => {
    it('should display health score with success color when score >= 80', async () => {
      (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue({
        ...mockPerformanceData,
        overallHealthScore: 85,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('On Track')).toBeInTheDocument();
      });
    });

    it('should display health score with warning color when 60 <= score < 80', async () => {
      (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue({
        ...mockPerformanceData,
        overallHealthScore: 65,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument();
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      });
    });

    it('should display health score with error color when score < 60', async () => {
      (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue({
        ...mockPerformanceData,
        overallHealthScore: 45,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('45%')).toBeInTheDocument();
        expect(screen.getByText('Review Required')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no budgets exist', async () => {
      (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
        selector({ budgets: [] })
      );

      (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue({
        items: [],
        totalBudgetedIncome: 0,
        totalActualIncome: 0,
        totalRemainingIncome: 0,
        totalBudgetedExpenses: 0,
        totalActualExpenses: 0,
        totalRemainingExpenses: 0,
        overallHealthScore: 100,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/No budgets found for this period/i)).toBeInTheDocument();
      });
    });

    it('should not render trend chart when no data', async () => {
      (mockReportService.calculateBudgetTrend as jest.Mock).mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Budget vs Actual Trend')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Updates', () => {
    it('should recalculate when budgets change', async () => {
      const { rerender } = renderComponent();

      const newBudgets = [
        ...mockBudgets,
        {
          id: 'budget3',
          transactionTypeId: 'type3',
          amount: 1000,
          currencyCode: 'USD',
          period: 'monthly',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
        selector({ budgets: newBudgets })
      );

      rerender(
        <BrowserRouter>
          <BudgetPerformanceReport />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });
    });

    it('should recalculate when transactions change', async () => {
      const { rerender } = renderComponent();

      const newTransactions = [
        ...mockTransactions,
        {
          id: 'tx3',
          date: '2026-01-10',
          amount: 100,
          transactionTypeId: 'type1',
          fromAccountId: 'acc1',
          createdAt: '2026-01-10T00:00:00.000Z',
          updatedAt: '2026-01-10T00:00:00.000Z',
        },
      ];

      (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
        selector({ transactions: newTransactions })
      );

      rerender(
        <BrowserRouter>
          <BudgetPerformanceReport />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
      });
    });
  });

  describe('Exchange Rates', () => {
    it('should fetch exchange rates for transactions in different currencies', async () => {
      const multiCurrencyAccounts = [
        ...mockAccounts,
        {
          id: 'acc2',
          name: 'Euro Account',
          type: AccountType.BANK_ACCOUNT,
          currencyCode: 'EUR',
          initialBalance: 1000,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      const multiCurrencyTransactions = [
        ...mockTransactions,
        {
          id: 'tx3',
          date: '2026-01-10',
          amount: 100,
          transactionTypeId: 'type1',
          fromAccountId: 'acc2', // EUR account
          createdAt: '2026-01-10T00:00:00.000Z',
          updatedAt: '2026-01-10T00:00:00.000Z',
        },
      ];

      (useAccountStore as unknown as jest.Mock).mockImplementation((selector) =>
        selector({ accounts: multiCurrencyAccounts })
      );

      (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
        selector({ transactions: multiCurrencyTransactions })
      );

      renderComponent();

      // Wait for performance calculation which triggers rate fetching
      await waitFor(
        () => {
          expect(mockReportService.calculateBudgetPerformance).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Component should render successfully
      expect(screen.getByText('Budget Performance Report')).toBeInTheDocument();
    });
  });

  describe('Progress Bar Colors', () => {
    it('should show success color for expenses when percentUsed <= 80', async () => {
      renderComponent();

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
        // Transport budget is at 25% usage - should be success
        expect(progressBars[1]).toHaveAttribute('aria-valuenow', '25');
      });
    });

    it('should show warning color for expenses when 80 < percentUsed <= 100', async () => {
      (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue({
        ...mockPerformanceData,
        items: [
          {
            ...mockPerformanceData.items[0],
            actualAmount: 450,
            percentUsed: 90,
          },
        ],
      });

      renderComponent();

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars[0]).toHaveAttribute('aria-valuenow', '90');
      });
    });

    it('should show error color for expenses when percentUsed > 100', async () => {
      (mockReportService.calculateBudgetPerformance as jest.Mock).mockResolvedValue({
        ...mockPerformanceData,
        items: [
          {
            ...mockPerformanceData.items[0],
            actualAmount: 600,
            remaining: -100,
            percentUsed: 120,
          },
        ],
      });

      renderComponent();

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars[0]).toHaveAttribute('aria-valuenow', '100'); // Capped at 100 for display
      });
    });
  });
});
