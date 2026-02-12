/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCashFlowReport } from '@/hooks/reports/useCashFlowReport';
import { CurrencyCode, Group } from '@/types/enums';
import { CashFlowReport } from './CashFlowReport';

jest.mock('@/hooks/reports/useCashFlowReport');
jest.mock('@/contexts/StoreContext');

const mockUseCashFlowReport = useCashFlowReport as jest.MockedFunction<typeof useCashFlowReport>;
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('CashFlowReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      categories: [{ id: 'cat-1', name: 'Food', isDeleted: false, createdAt: '', updatedAt: '' }],
      accounts: [
        {
          id: 'acc-1',
          name: 'Checking',
          type: 'bank_account',
          currencyCode: CurrencyCode.USD,
          isActive: true,
          isDeleted: false,
          createdAt: '',
          updatedAt: '',
          initialBalance: 0,
        },
      ],
      transactionTypes: [
        {
          id: 'type-1',
          name: 'Groceries',
          categoryId: 'cat-1',
          group: Group.EXPENSE,
          isActive: true,
          isDeleted: false,
          createdAt: '',
          updatedAt: '',
        },
      ],
    } as any);
  });

  it('should render with no cash flow data', () => {
    mockUseCashFlowReport.mockReturnValue({
      cashFlow: null,
      cashFlowTrend: null,
      chartData: null,
      filters: { categoryIds: [], accountIds: [], searchText: '' },
      appliedFilters: { categoryIds: [], accountIds: [], searchText: '' },
      setFilter: jest.fn(),
      applyFilters: jest.fn(),
      resetFilters: jest.fn(),
      hasActiveFilters: false,
      startDate: '2024-01-01',
      setStartDate: jest.fn(),
      endDate: '2024-12-31',
      setEndDate: jest.fn(),
      conversionCurrency: CurrencyCode.USD,
      setConversionCurrency: jest.fn(),
    } as any);

    renderWithRouter(<CashFlowReport />);

    expect(screen.getByText('Cash Flow Report')).toBeInTheDocument();
  });

  it('should render with cash flow data', () => {
    mockUseCashFlowReport.mockReturnValue({
      cashFlow: {
        totalIncome: 5000,
        totalExpenses: 3000,
        netCashFlow: 2000,
        income: [{ categoryId: 'cat-2', categoryName: 'Income', total: 5000, transactionCount: 2 }],
        expenses: [{ categoryId: 'cat-1', categoryName: 'Food', total: 3000, transactionCount: 5 }],
      },
      cashFlowTrend: [
        { date: '2024-01-01', income: 2500, expenses: 1500, net: 1000 },
        { date: '2024-01-15', income: 5000, expenses: 3000, net: 2000 },
      ],
      chartData: {
        incomePieData: [{ name: 'Income', value: 5000 }],
        expensesPieData: [{ name: 'Food', value: 3000 }],
        incomeDetailData: [
          {
            categoryId: 'cat-2',
            categoryName: 'Income',
            total: 5000,
            transactionCount: 2,
            isTransactionType: false,
          },
        ],
        expenseDetailData: [
          {
            categoryId: 'cat-1',
            categoryName: 'Food',
            total: 3000,
            transactionCount: 5,
            isTransactionType: false,
          },
        ],
        groupingLabel: 'Category',
      },
      filters: { categoryIds: [], accountIds: [], searchText: '' },
      appliedFilters: { categoryIds: [], accountIds: [], searchText: '' },
      setFilter: jest.fn(),
      applyFilters: jest.fn(),
      resetFilters: jest.fn(),
      hasActiveFilters: false,
      startDate: '2024-01-01',
      setStartDate: jest.fn(),
      endDate: '2024-12-31',
      setEndDate: jest.fn(),
      conversionCurrency: CurrencyCode.USD,
      setConversionCurrency: jest.fn(),
    } as any);

    renderWithRouter(<CashFlowReport />);

    expect(screen.getByText('Cash Flow Report')).toBeInTheDocument();
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
  });

  it('should render with positive net cash flow indicator', () => {
    mockUseCashFlowReport.mockReturnValue({
      cashFlow: {
        totalIncome: 5000,
        totalExpenses: 3000,
        netCashFlow: 2000,
        income: [],
        expenses: [],
      },
      cashFlowTrend: [],
      chartData: {
        incomePieData: [],
        expensesPieData: [],
        incomeDetailData: [],
        expenseDetailData: [],
        groupingLabel: 'Category',
      },
      filters: { categoryIds: [], accountIds: [], searchText: '' },
      appliedFilters: { categoryIds: [], accountIds: [], searchText: '' },
      setFilter: jest.fn(),
      applyFilters: jest.fn(),
      resetFilters: jest.fn(),
      hasActiveFilters: false,
      startDate: '2024-01-01',
      setStartDate: jest.fn(),
      endDate: '2024-12-31',
      setEndDate: jest.fn(),
      conversionCurrency: CurrencyCode.USD,
      setConversionCurrency: jest.fn(),
    } as any);

    renderWithRouter(<CashFlowReport />);

    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
  });
});
