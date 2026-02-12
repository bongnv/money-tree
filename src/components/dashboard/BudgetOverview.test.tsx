/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useBudgetOverview } from '@/hooks/dashboard/useBudgetOverview';
import { CurrencyCode } from '@/types/enums';
import { BudgetOverview } from './BudgetOverview';

jest.mock('@/hooks/dashboard/useBudgetOverview');
jest.mock('@/contexts/StoreContext');

const mockUseBudgetOverview = useBudgetOverview as jest.MockedFunction<typeof useBudgetOverview>;
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('BudgetOverview', () => {
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

  it('should show create budget message when no budgets', () => {
    mockUseBudgetOverview.mockReturnValue({ budgets: [], isLoading: false });

    renderWithRouter(<BudgetOverview period={period} />);

    expect(screen.getByText('Set up budgets to track spending')).toBeInTheDocument();
    expect(screen.getByText('Create Budget')).toBeInTheDocument();
  });

  it('should show create budget message when loading', () => {
    mockUseBudgetOverview.mockReturnValue({ budgets: [], isLoading: true });

    renderWithRouter(<BudgetOverview period={period} />);

    expect(screen.getByText('Set up budgets to track spending')).toBeInTheDocument();
  });

  it('should render budget progress bars when budgets exist', () => {
    mockUseBudgetOverview.mockReturnValue({
      budgets: [
        { id: 'b1', name: 'Groceries', spent: 500, budget: 1000, percentage: 50, isIncome: false },
        { id: 'b2', name: 'Salary', spent: 4000, budget: 5000, percentage: 80, isIncome: true },
      ],
      isLoading: false,
    });

    renderWithRouter(<BudgetOverview period={period} />);

    expect(screen.getByText('View All Budgets')).toBeInTheDocument();
  });
});
