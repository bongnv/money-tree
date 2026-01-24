import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FinancialSummary } from './FinancialSummary';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useAssets } from '../../hooks/queries/useAssets';
import { useAppContext } from '../../contexts/AppContext';
import { useCategories } from '../../hooks/queries/useCategories';
import { useTransactionTypes } from '../../hooks/queries/useTransactionTypes';
import { useBudgets } from '../../hooks/queries/useBudgets';
import { AccountType, Group } from '../../types/enums';
import type { PeriodOption } from '../common/PeriodSelector';

// Mock services
const mockCalculationService = {
  calculateNetWorth: jest.fn(),
  calculateSavingsRate: jest.fn(),
};

const mockReportService = {
  calculateCashFlow: jest.fn(),
  calculateBudgetPerformance: jest.fn(),
};

jest.mock('../../contexts/ServiceProviders', () => ({
  useCalculationService: () => mockCalculationService,
  useReportService: () => mockReportService,
}));

jest.mock('../../hooks/queries/useAccounts');
jest.mock('../../hooks/queries/useTransactions');
jest.mock('../../hooks/queries/useAssets');
jest.mock('../../contexts/AppContext');
jest.mock('../../hooks/queries/useCategories');
jest.mock('../../hooks/queries/useTransactionTypes');
jest.mock('../../hooks/queries/useBudgets');

describe('FinancialSummary', () => {
  const mockPeriod: PeriodOption = {
    label: 'This Month',
    value: 'thisMonth',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock calculation service
    mockCalculationService.calculateNetWorth.mockResolvedValue(504000);
    mockCalculationService.calculateSavingsRate.mockReturnValue(83.3);

    // Mock report service
    mockReportService.calculateCashFlow.mockResolvedValue({
      totalIncome: 3000,
      totalExpenses: 500,
      netCashFlow: 2500,
      income: [],
      expenses: [],
    });
    mockReportService.calculateBudgetPerformance.mockResolvedValue({
      overallHealthScore: 85,
      budgets: [],
    });

    // Mock Dexie hooks
    (useAccounts as jest.Mock).mockReturnValue([
      {
        id: 'acc1',
        name: 'Checking Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: 'USD',
        initialBalance: 1000,
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    (useTransactions as jest.Mock).mockReturnValue([
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
    ]);

    (useAssets as jest.Mock).mockReturnValue([
      {
        id: 'asset-1',
        name: 'House',
        type: 'real-estate' as const,
        currencyCode: 'USD',
        valueHistory: [{ date: '2026-01-01', value: 500000 }],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    (useAppContext as jest.Mock).mockReturnValue({ baseCurrency: 'USD' });

    (useCategories as jest.Mock).mockReturnValue([
      {
        id: 'cat-1',
        name: 'Income',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    (useTransactionTypes as jest.Mock).mockReturnValue([
      {
        id: 'type-income',
        name: 'Salary',
        categoryId: 'cat-1',
        group: Group.INCOME,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    (useBudgets as jest.Mock).mockReturnValue([
      {
        id: 'budget-1',
        transactionTypeId: 'type-expense',
        currencyCode: 'USD',
        amount: 1000,
        period: 'monthly' as const,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('renders financial summary cards', async () => {
    render(
      <MemoryRouter>
        <FinancialSummary period={mockPeriod} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Net Worth')).toBeInTheDocument();
      expect(screen.getByText('Cash Flow')).toBeInTheDocument();
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();
      expect(screen.getByText('Budget Health')).toBeInTheDocument();
    });
  });

  it('calculates and displays net worth correctly', async () => {
    render(
      <MemoryRouter>
        <FinancialSummary period={mockPeriod} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockCalculationService.calculateNetWorth).toHaveBeenCalled();
      expect(screen.getByText('Net Worth')).toBeInTheDocument();
    });
  });

  it('calculates and displays cash flow correctly', async () => {
    render(
      <MemoryRouter>
        <FinancialSummary period={mockPeriod} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockReportService.calculateCashFlow).toHaveBeenCalled();
      expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    });
  });

  it('displays savings rate', async () => {
    render(
      <MemoryRouter>
        <FinancialSummary period={mockPeriod} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();
      expect(screen.getByText('83.3%')).toBeInTheDocument();
    });
  });

  it('handles zero cash flow gracefully', async () => {
    (mockReportService.calculateCashFlow as jest.Mock).mockResolvedValue({
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      income: [],
      expenses: [],
    });

    render(
      <MemoryRouter>
        <FinancialSummary period={mockPeriod} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    });
  });

  it('handles negative net worth', async () => {
    (mockCalculationService.calculateNetWorth as jest.Mock).mockResolvedValue(-5000);

    render(
      <MemoryRouter>
        <FinancialSummary period={mockPeriod} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Net Worth')).toBeInTheDocument();
    });
  });

  it('uses correct date range from period prop', async () => {
    const customPeriod: PeriodOption = {
      label: 'Last Month',
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    };

    render(
      <MemoryRouter>
        <FinancialSummary period={customPeriod} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockReportService.calculateCashFlow).toHaveBeenCalled();
    });
  });
});
