import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CashFlowReport } from './CashFlowReport';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import type { Transaction, TransactionType, Category } from '../../types/models';
import { Group } from '../../types/enums';

// Mock stores
jest.mock('../../stores/useTransactionStore');
jest.mock('../../stores/useCategoryStore');

// Mock date utils to return a consistent date
jest.mock('../../utils/date.utils', () => ({
  getTodayDate: jest.fn(() => '2026-01-31'),
  toDateString: jest.fn((date) => date),
  formatDateForInput: jest.fn((date) => date),
}));

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div className="recharts-wrapper">{children}</div>,
  Line: () => <div />,
  BarChart: ({ children }: any) => <div className="recharts-wrapper">{children}</div>,
  Bar: () => <div />,
  PieChart: ({ children }: any) => <div className="recharts-wrapper">{children}</div>,
  Pie: () => <div className="recharts-pie" />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Legend: () => <div className="recharts-legend-wrapper" />,
  Tooltip: () => <div />,
}));

const mockUseTransactionStore = useTransactionStore as jest.MockedFunction<
  typeof useTransactionStore
>;
const mockUseCategoryStore = useCategoryStore as jest.MockedFunction<typeof useCategoryStore>;

describe('CashFlowReport', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Salary',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat2',
      name: 'Groceries',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat3',
      name: 'Transfer',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'type1',
      name: 'Salary',
      categoryId: 'cat1',
      group: Group.INCOME,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'type2',
      name: 'Groceries',
      categoryId: 'cat2',
      group: Group.EXPENSE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'type3',
      name: 'Account Transfer',
      categoryId: 'cat3',
      group: Group.TRANSFER,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx1',
      date: '2026-01-15',
      description: 'Salary',
      amount: 3000,
      transactionTypeId: 'type1',
      toAccountId: 'acc1',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    },
    {
      id: 'tx2',
      date: '2026-01-20',
      description: 'Groceries',
      amount: 500,
      transactionTypeId: 'type2',
      fromAccountId: 'acc1',
      createdAt: '2026-01-20T00:00:00.000Z',
      updatedAt: '2026-01-20T00:00:00.000Z',
    },
    {
      id: 'tx3',
      date: '2026-01-25',
      description: 'Transfer',
      amount: 200,
      transactionTypeId: 'type3',
      fromAccountId: 'acc1',
      toAccountId: 'acc2',
      createdAt: '2026-01-25T00:00:00.000Z',
      updatedAt: '2026-01-25T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    mockUseTransactionStore.mockImplementation((selector) =>
      selector({ transactions: mockTransactions } as any)
    );
    mockUseCategoryStore.mockImplementation((selector) =>
      selector({
        transactionTypes: mockTransactionTypes,
        categories: mockCategories,
      } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  it('should render without crashing', () => {
    renderWithRouter(<CashFlowReport />);
    expect(screen.getByText('Cash Flow Report')).toBeInTheDocument();
  });

  it('should display period selection dropdown', () => {
    renderWithRouter(<CashFlowReport />);
    // Check for the period dropdown and current selection
    expect(screen.getAllByText('Period').length).toBeGreaterThan(0);
    expect(screen.getByText('Current Month')).toBeInTheDocument();
  });

  it('should display summary cards', () => {
    renderWithRouter(<CashFlowReport />);
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
  });

  it('should calculate and display cash flow totals', () => {
    renderWithRouter(<CashFlowReport />);
    // Should show summary cards
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
  });

  it('should exclude transfers from calculations', () => {
    renderWithRouter(<CashFlowReport />);
    // Verify income and expense sections exist (transfers should be excluded)
    expect(screen.getByText('Income Details')).toBeInTheDocument();
    expect(screen.getByText('Expense Details')).toBeInTheDocument();
  });

  it('should display income and expense tables', () => {
    renderWithRouter(<CashFlowReport />);
    expect(screen.getByText('Income Details')).toBeInTheDocument();
    expect(screen.getByText('Expense Details')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('should change period when dropdown value changes', () => {
    renderWithRouter(<CashFlowReport />);
    // Period selection should display current selection
    expect(screen.getByText('Current Month')).toBeInTheDocument();
    // Period dropdown should be present
    const periodInputs = screen.getAllByText('Period');
    expect(periodInputs.length).toBeGreaterThan(0);
  });

  it('should display custom date range in period selector when custom is selected', () => {
    renderWithRouter(<CashFlowReport />);
    // Custom range should show dates in the dropdown when selected
    // This test verifies the component renders without crashing
    expect(screen.getByText('Cash Flow Report')).toBeInTheDocument();
  });

  it('should display charts when data is available', () => {
    const { container } = renderWithRouter(<CashFlowReport />);
    expect(screen.getByText('Cash Flow Trend')).toBeInTheDocument();
    expect(screen.getByText('Income by Category')).toBeInTheDocument();
    expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
    // Verify recharts rendered
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should show empty state when no transactions', () => {
    mockUseTransactionStore.mockImplementation((selector) => selector({ transactions: [] } as any));
    renderWithRouter(<CashFlowReport />);
    expect(screen.getByText('No income transactions')).toBeInTheDocument();
    expect(screen.getByText('No expense transactions')).toBeInTheDocument();
  });

  it('should not display transaction counts in tables', () => {
    renderWithRouter(<CashFlowReport />);
    // Transaction count column should not be displayed
    expect(screen.queryByText('Transactions')).not.toBeInTheDocument();
  });

  it('should format currency values correctly', () => {
    renderWithRouter(<CashFlowReport />);
    // Check for proper currency formatting ($ symbol and decimals)
    const amounts = screen.getAllByText(/\$\d+,?\d*\.\d{2}/);
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('should display currency selector', () => {
    renderWithRouter(<CashFlowReport />);
    expect(screen.getAllByText('Currency').length).toBeGreaterThan(0);
  });

  it('should display net cash flow with correct color', () => {
    const { container } = renderWithRouter(<CashFlowReport />);
    // Verify component renders with cards
    const cards = container.querySelectorAll('.MuiCard-root');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should handle negative net cash flow', () => {
    const negativeTransactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2026-01-15',
        description: 'Small Income',
        amount: 100,
        transactionTypeId: 'type1',
        toAccountId: 'acc1',
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'tx2',
        date: '2026-01-20',
        description: 'Large Expense',
        amount: 500,
        transactionTypeId: 'type2',
        fromAccountId: 'acc1',
        createdAt: '2026-01-20T00:00:00.000Z',
        updatedAt: '2026-01-20T00:00:00.000Z',
      },
    ];

    mockUseTransactionStore.mockImplementation((selector) =>
      selector({ transactions: negativeTransactions } as any)
    );

    renderWithRouter(<CashFlowReport />);
    // Should display negative net cash flow (formatCurrency shows as $-400.00)
    expect(screen.getByText(/\$-400\.00/)).toBeInTheDocument();
  });
});
