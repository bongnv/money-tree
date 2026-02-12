/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FinancialSummary } from './FinancialSummary';
import { useFinancialSummary } from '@/hooks/dashboard/useFinancialSummary';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode } from '@/types/enums';

jest.mock('@/hooks/dashboard/useFinancialSummary');
jest.mock('@/contexts/StoreContext');

const mockUseFinancialSummary = useFinancialSummary as jest.MockedFunction<
  typeof useFinancialSummary
>;
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('FinancialSummary', () => {
  const period = {
    value: 'current-month',
    label: 'Current Month',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({ baseCurrency: CurrencyCode.USD } as any);
  });

  it('should render all four summary cards', () => {
    mockUseFinancialSummary.mockReturnValue({
      netWorth: 50000,
      cashFlow: 2000,
      savingsRate: 25,
      budgetHealth: 85,
      error: null,
      isLoading: false,
    });

    renderWithRouter(<FinancialSummary period={period} />);

    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Savings Rate')).toBeInTheDocument();
    expect(screen.getByText('Budget Health')).toBeInTheDocument();
  });

  it('should show error alert when error exists', () => {
    mockUseFinancialSummary.mockReturnValue({
      netWorth: 0,
      cashFlow: 0,
      savingsRate: 0,
      budgetHealth: 0,
      error: 'Missing exchange rate for SGD',
      isLoading: false,
    });

    renderWithRouter(<FinancialSummary period={period} />);

    expect(screen.getByText('Missing exchange rate for SGD')).toBeInTheDocument();
  });

  it('should format savings rate as percentage', () => {
    mockUseFinancialSummary.mockReturnValue({
      netWorth: 50000,
      cashFlow: 2000,
      savingsRate: 15.5,
      budgetHealth: 70,
      error: null,
      isLoading: false,
    });

    renderWithRouter(<FinancialSummary period={period} />);

    expect(screen.getByText('15.5%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });
});
