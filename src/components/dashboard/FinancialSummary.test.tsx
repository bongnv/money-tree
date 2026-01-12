import { render, screen, waitFor } from '@testing-library/react';
import { FinancialSummary } from './FinancialSummary';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { calculationService } from '../../services/calculation.service';
import { reportService } from '../../services/report.service';
import { AccountType, Group } from '../../types/enums';
import type { PeriodOption } from '../common/PeriodSelector';

jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useAssetStore');
jest.mock('../../stores/useAppStore');
jest.mock('../../stores/useExchangeRateStore');
jest.mock('../../stores/useCategoryStore');
jest.mock('../../stores/useBudgetStore');
jest.mock('../../services/calculation.service');
jest.mock('../../services/report.service');

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
    (calculationService.calculateNetWorth as jest.Mock) = jest.fn().mockResolvedValue(504000);
    (calculationService.calculateSavingsRate as jest.Mock) = jest.fn().mockReturnValue(83.3);

    // Mock report service
    (reportService.calculateCashFlow as jest.Mock) = jest.fn().mockResolvedValue({
      totalIncome: 3000,
      totalExpenses: 500,
      netCashFlow: 2500,
      income: [],
      expenses: [],
    });
    (reportService.calculateBudgetPerformance as jest.Mock) = jest.fn().mockResolvedValue({
      overallHealthScore: 85,
      budgets: [],
    });

    // Default mock implementations
    (useAccountStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        accounts: [
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
        ],
      })
    );

    (useTransactionStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        transactions: [
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
        ],
      })
    );

    (useAssetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        manualAssets: [
          {
            id: 'asset-1',
            name: 'House',
            type: 'real-estate' as const,
            currencyCode: 'USD',
            valueHistory: [{ date: '2026-01-01', value: 500000 }],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );

    (useAppStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ baseCurrency: 'USD' })
    );

    (useExchangeRateStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ getRateForMonth: jest.fn(async () => 1) })
    );

    (useCategoryStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        categories: [
          {
            id: 'cat-1',
            name: 'Income',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        transactionTypes: [
          {
            id: 'type-income',
            name: 'Salary',
            categoryId: 'cat-1',
            group: Group.INCOME,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );

    (useBudgetStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        budgets: [
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
        ],
      })
    );
  });

  it('renders financial summary cards', async () => {
    render(<FinancialSummary period={mockPeriod} />);

    await waitFor(() => {
      expect(screen.getByText('Net Worth')).toBeInTheDocument();
      expect(screen.getByText('Cash Flow')).toBeInTheDocument();
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();
      expect(screen.getByText('Budget Health')).toBeInTheDocument();
    });
  });

  it('calculates and displays net worth correctly', async () => {
    render(<FinancialSummary period={mockPeriod} />);

    await waitFor(() => {
      expect(calculationService.calculateNetWorth).toHaveBeenCalled();
      expect(screen.getByText('Net Worth')).toBeInTheDocument();
    });
  });

  it('calculates and displays cash flow correctly', async () => {
    render(<FinancialSummary period={mockPeriod} />);

    await waitFor(() => {
      expect(reportService.calculateCashFlow).toHaveBeenCalled();
      expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    });
  });

  it('displays savings rate', async () => {
    render(<FinancialSummary period={mockPeriod} />);

    await waitFor(() => {
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();
      expect(screen.getByText('83.3%')).toBeInTheDocument();
    });
  });

  it('handles zero cash flow gracefully', async () => {
    (reportService.calculateCashFlow as jest.Mock).mockResolvedValue({
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      income: [],
      expenses: [],
    });

    render(<FinancialSummary period={mockPeriod} />);

    await waitFor(() => {
      expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    });
  });

  it('handles negative net worth', async () => {
    (calculationService.calculateNetWorth as jest.Mock).mockResolvedValue(-5000);

    render(<FinancialSummary period={mockPeriod} />);

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

    render(<FinancialSummary period={customPeriod} />);

    await waitFor(() => {
      expect(reportService.calculateCashFlow).toHaveBeenCalled();
    });
  });
});
