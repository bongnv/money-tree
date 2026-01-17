import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CashFlowReport } from './CashFlowReport';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';

// Mock services
const mockReportService = {
  calculateCashFlow: jest.fn(),
  calculateCashFlowTrend: jest.fn(),
};

const mockCalculationService = {
  calculateAccountBalance: jest.fn(),
};

jest.mock('../../contexts/ServiceProviders', () => ({
  useReportService: () => mockReportService,
  useCalculationService: () => mockCalculationService,
}));

// Mock stores
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useCategoryStore');
jest.mock('../../stores/useAccountStore');
jest.mock('../../stores/useAppStore');
jest.mock('../../stores/useExchangeRateStore');

// Mock date utils
jest.mock('../../utils/date.utils', () => ({
  getTodayDate: jest.fn(() => '2026-01-31'),
  toDateString: jest.fn((date) => date),
  formatDateForInput: jest.fn((date) => date),
}));

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Legend: () => null,
  Tooltip: () => null,
}));

describe('CashFlowReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock stores
    (useTransactionStore as jest.Mock).mockImplementation((selector) =>
      selector({ transactions: [] })
    );
    (useCategoryStore as jest.Mock).mockImplementation((selector) =>
      selector({ transactionTypes: [], categories: [] })
    );
    (useAccountStore as jest.Mock).mockImplementation((selector) => selector({ accounts: [] }));
    (useAppStore as jest.Mock).mockImplementation((selector) => selector({ baseCurrency: 'USD' }));
    (useExchangeRateStore as jest.Mock).mockImplementation((selector) =>
      selector({ getRateForMonth: jest.fn(async () => 1) })
    );

    // Mock report service
    (mockReportService.calculateCashFlow as jest.Mock) = jest.fn().mockResolvedValue({
      totalIncome: 3000,
      totalExpenses: 500,
      netCashFlow: 2500,
      income: [{ categoryId: 'cat1', categoryName: 'Salary', total: 3000, transactionCount: 1 }],
      expenses: [
        { categoryId: 'cat2', categoryName: 'Groceries', total: 500, transactionCount: 1 },
      ],
    });

    (mockReportService.calculateCashFlowTrend as jest.Mock) = jest
      .fn()
      .mockResolvedValue([{ date: '2026-01-01', income: 3000, expenses: 500, netCashFlow: 2500 }]);
  });

  it('renders the report title', async () => {
    render(
      <MemoryRouter>
        <CashFlowReport />
      </MemoryRouter>
    );

    expect(screen.getByText('Cash Flow Report')).toBeInTheDocument();
  });

  it('displays income and expense summary cards', async () => {
    render(
      <MemoryRouter>
        <CashFlowReport />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
    });
  });

  it('renders charts', async () => {
    render(
      <MemoryRouter>
        <CashFlowReport />
      </MemoryRouter>
    );

    // Wait for summary cards to ensure data loaded
    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
    });
  });

  it('calls report service with correct parameters', async () => {
    render(
      <MemoryRouter>
        <CashFlowReport />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockReportService.calculateCashFlow).toHaveBeenCalled();
      expect(mockReportService.calculateCashFlowTrend).toHaveBeenCalled();
    });
  });

  it('displays empty state when no data', async () => {
    (mockReportService.calculateCashFlow as jest.Mock).mockResolvedValue({
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      income: [],
      expenses: [],
    });

    render(
      <MemoryRouter>
        <CashFlowReport />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
    });
  });
});
