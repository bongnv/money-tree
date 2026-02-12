/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useBudgetPerformance } from '@/hooks/reports/useBudgetPerformance';
import { CurrencyCode } from '@/types/enums';
import { BudgetPerformanceReport } from './BudgetPerformanceReport';

jest.mock('@/hooks/reports/useBudgetPerformance');
jest.mock('@/contexts/StoreContext');

const mockUseBudgetPerformance = useBudgetPerformance as jest.MockedFunction<
  typeof useBudgetPerformance
>;
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('BudgetPerformanceReport', () => {
  const defaultPerformanceReturn = {
    budgetPerformance: null,
    displayPerformance: {
      items: [],
      totalBudgetedIncome: 0,
      totalActualIncome: 0,
      totalRemainingIncome: 0,
      totalBudgetedExpenses: 0,
      totalActualExpenses: 0,
      totalRemainingExpenses: 0,
      overallHealthScore: 100,
    },
    groupedItems: [],
    trendData: [],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    setDateRange: jest.fn(),
    conversionCurrency: CurrencyCode.USD,
    setConversionCurrency: jest.fn(),
    selectedCategories: [],
    handleCategoryChange: jest.fn(),
    handleClearFilters: jest.fn(),
    handleItemClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      categories: [],
      transactionTypes: [],
      accounts: [],
      transactions: [],
      budgets: [],
      assets: [],
      exchangeRatesMap: new Map(),
    } as any);
  });

  it('should render budget performance page', () => {
    mockUseBudgetPerformance.mockReturnValue(defaultPerformanceReturn as any);

    renderWithRouter(<BudgetPerformanceReport />);

    expect(screen.getByText('Budget Performance Report')).toBeInTheDocument();
  });

  it('should render with performance data and items', () => {
    mockUseBudgetPerformance.mockReturnValue({
      ...defaultPerformanceReturn,
      budgetPerformance: {
        items: [
          {
            categoryId: 'cat-1',
            categoryName: 'Food',
            transactionTypeId: 'type-1',
            transactionTypeName: 'Groceries',
            budgetedAmount: 1000,
            actualAmount: 750,
            remaining: 250,
            percentUsed: 75,
            isIncome: false,
          },
        ],
        overallHealthScore: 85,
      },
      displayPerformance: {
        ...defaultPerformanceReturn.displayPerformance,
        items: [
          {
            categoryId: 'cat-1',
            categoryName: 'Food',
            transactionTypeId: 'type-1',
            transactionTypeName: 'Groceries',
            budgetedAmount: 1000,
            actualAmount: 750,
            remaining: 250,
            percentUsed: 75,
            isIncome: false,
          },
        ],
        totalBudgetedExpenses: 1000,
        totalActualExpenses: 750,
        totalRemainingExpenses: 250,
        overallHealthScore: 85,
      },
      groupedItems: [
        {
          categoryId: 'cat-1',
          categoryName: 'Food',
          isCategory: true,
          budgetedAmount: 1000,
          actualAmount: 750,
          remaining: 250,
          percentUsed: 75,
          isIncome: false,
        },
      ],
      trendData: [{ date: '2024-01-01', budgeted: 1000, actual: 200, health: 80 }],
    } as any);

    renderWithRouter(<BudgetPerformanceReport />);

    expect(screen.getByText('Budget Performance Report')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('should render with income items', () => {
    mockUseBudgetPerformance.mockReturnValue({
      ...defaultPerformanceReturn,
      displayPerformance: {
        ...defaultPerformanceReturn.displayPerformance,
        totalBudgetedIncome: 5000,
        totalActualIncome: 4500,
        totalRemainingIncome: 500,
      },
    } as any);

    renderWithRouter(<BudgetPerformanceReport />);

    expect(screen.getByText('Budget Performance Report')).toBeInTheDocument();
  });
});
