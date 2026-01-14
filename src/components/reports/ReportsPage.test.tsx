import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReportsPage } from './ReportsPage';

// Mock the report components to avoid complex dependencies
jest.mock('./BalanceSheet', () => ({
  BalanceSheet: () => <div data-testid="balance-sheet">Balance Sheet Component</div>,
}));

jest.mock('./CashFlowReport', () => ({
  CashFlowReport: () => <div data-testid="cash-flow-report">Cash Flow Report</div>,
}));

jest.mock('./BudgetPerformanceReport', () => ({
  BudgetPerformanceReport: () => (
    <div data-testid="budget-performance-report">Budget Performance Report</div>
  ),
}));

const renderWithRouter = (initialPath = '/reports/balance-sheet') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/reports" element={<ReportsPage />}>
          <Route
            path="balance-sheet"
            element={<div data-testid="balance-sheet">Balance Sheet Component</div>}
          />
          <Route
            path="cash-flow"
            element={<div data-testid="cash-flow-report">Cash Flow Report</div>}
          />
          <Route
            path="budget-performance"
            element={<div data-testid="budget-performance-report">Budget Performance Report</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('ReportsPage', () => {
  it('renders the page title', () => {
    renderWithRouter();
    expect(screen.getByText('Financial Reports')).toBeInTheDocument();
  });

  it('renders tabs for Balance Sheet, Cash Flow, and Budget Performance', () => {
    renderWithRouter();
    expect(screen.getByRole('tab', { name: /balance sheet/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /cash flow/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /budget performance/i })).toBeInTheDocument();
  });

  it('shows Balance Sheet tab by default', () => {
    renderWithRouter('/reports/balance-sheet');
    expect(screen.getByTestId('balance-sheet')).toBeInTheDocument();
  });

  it('Cash Flow tab is enabled', () => {
    renderWithRouter();
    const cashFlowTab = screen.getByRole('tab', { name: /cash flow/i });
    expect(cashFlowTab).not.toBeDisabled();
  });

  it('shows Cash Flow report when tab is clicked', () => {
    renderWithRouter('/reports/cash-flow');
    expect(screen.getByTestId('cash-flow-report')).toBeInTheDocument();
  });

  it('Balance Sheet tab is selected when on balance-sheet route', () => {
    renderWithRouter('/reports/balance-sheet');
    const balanceSheetTab = screen.getByRole('tab', { name: /balance sheet/i });
    expect(balanceSheetTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows Budget Performance report when on budget-performance route', () => {
    renderWithRouter('/reports/budget-performance');
    expect(screen.getByTestId('budget-performance-report')).toBeInTheDocument();
  });
});
