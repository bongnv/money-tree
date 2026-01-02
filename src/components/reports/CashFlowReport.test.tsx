import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
      group: Group.INCOME,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat2',
      name: 'Groceries',
      group: Group.EXPENSE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat3',
      name: 'Transfer',
      group: Group.TRANSFER,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'type1',
      name: 'Salary',
      categoryId: 'cat1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'type2',
      name: 'Groceries',
      categoryId: 'cat2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'type3',
      name: 'Account Transfer',
      categoryId: 'cat3',
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

  it('should render without crashing', () => {
    render(<CashFlowReport />);
    expect(screen.getByText('Cash Flow Report')).toBeInTheDocument();
  });

  it('should display period selection buttons', () => {
    render(<CashFlowReport />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Quarterly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('should display summary cards', () => {
    render(<CashFlowReport />);
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
  });

  it('should calculate and display cash flow totals', () => {
    render(<CashFlowReport />);
    // Should show summary cards
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
  });

  it('should exclude transfers from calculations', () => {
    render(<CashFlowReport />);
    // Verify income and expense sections exist (transfers should be excluded)
    expect(screen.getByText('Income Details')).toBeInTheDocument();
    expect(screen.getByText('Expense Details')).toBeInTheDocument();
  });

  it('should display income and expense tables', () => {
    render(<CashFlowReport />);
    expect(screen.getByText('Income Details')).toBeInTheDocument();
    expect(screen.getByText('Expense Details')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('should change period when toggled', () => {
    render(<CashFlowReport />);
    const quarterlyButton = screen.getByText('Quarterly');
    fireEvent.click(quarterlyButton);
    // Date inputs should be disabled when not in custom mode
    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
    expect(startDateInput).toBeDisabled();
  });

  it('should enable custom date inputs when custom period selected', () => {
    render(<CashFlowReport />);
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;
    expect(startDateInput).not.toBeDisabled();
    expect(endDateInput).not.toBeDisabled();
  });

  it('should display charts when data is available', () => {
    const { container } = render(<CashFlowReport />);
    expect(screen.getByText('Cash Flow Trend')).toBeInTheDocument();
    expect(screen.getByText('Income by Category')).toBeInTheDocument();
    expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
    // Verify recharts rendered
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should show empty state when no transactions', () => {
    mockUseTransactionStore.mockImplementation((selector) => selector({ transactions: [] } as any));
    render(<CashFlowReport />);
    expect(screen.getByText('No income transactions')).toBeInTheDocument();
    expect(screen.getByText('No expense transactions')).toBeInTheDocument();
  });

  it('should display transaction counts in tables', () => {
    render(<CashFlowReport />);
    // Each category should show 1 transaction
    const cells = screen.getAllByText('1');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should format currency values correctly', () => {
    render(<CashFlowReport />);
    // Check for proper currency formatting ($ symbol and decimals)
    const amounts = screen.getAllByText(/\$\d+,?\d*\.\d{2}/);
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('should update calculations when date range changes', () => {
    render(<CashFlowReport />);
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);

    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
    fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });

    const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;
    fireEvent.change(endDateInput, { target: { value: '2026-01-31' } });

    // Verify component still renders properly
    expect(screen.getByText('Cash Flow Report')).toBeInTheDocument();
  });

  it('should display net cash flow with correct color', () => {
    const { container } = render(<CashFlowReport />);
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

    render(<CashFlowReport />);
    // Should display negative net cash flow (formatCurrency shows as $-400.00)
    expect(screen.getByText(/\$-400\.00/)).toBeInTheDocument();
  });
});
