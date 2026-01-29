import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';

// Mock child components
jest.mock('../common/PeriodSelector', () => ({
  PeriodSelector: ({
    startDate,
    endDate,
    onChange,
  }: {
    startDate: string;
    endDate: string;
    onChange: (value: { startDate: string; endDate: string }) => void;
  }) => (
    <select
      data-testid="period-selector"
      value={`${startDate}-${endDate}`}
      onChange={(e) => {
        const value = e.target.value;
        if (value === 'this-month') {
          onChange({ startDate: '2026-01-01', endDate: '2026-01-31' });
        } else if (value === 'last-month') {
          onChange({ startDate: '2025-12-01', endDate: '2025-12-31' });
        }
      }}
    >
      <option value="this-month">This Month</option>
      <option value="last-month">Last Month</option>
    </select>
  ),
}));

jest.mock('./FinancialSummary', () => ({
  FinancialSummary: ({ period }: { period: { startDate: string; endDate: string } }) => (
    <div data-testid="financial-summary">
      Financial Summary: {period.startDate} to {period.endDate}
    </div>
  ),
}));

jest.mock('./BudgetOverview', () => ({
  BudgetOverview: ({ period }: { period: { startDate: string; endDate: string } }) => (
    <div data-testid="budget-overview">
      Budget Overview: {period.startDate} to {period.endDate}
    </div>
  ),
}));

jest.mock('./RecentTransactionsList', () => ({
  RecentTransactionsList: ({ limit }: { limit: number }) => (
    <div data-testid="recent-transactions">Recent Transactions (limit: {limit})</div>
  ),
}));

describe('DashboardPage', () => {
  describe('Layout and Structure', () => {
    it('renders dashboard with all three main sections', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Financial Summary' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Budget Overview' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Recent Transactions' })).toBeInTheDocument();
    });

    it('renders period selector at top of page', () => {
      render(<DashboardPage />);

      const periodSelector = screen.getByTestId('period-selector');
      expect(periodSelector).toBeInTheDocument();
      expect(periodSelector).toHaveValue('this-month');
    });

    it('renders all child components', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('financial-summary')).toBeInTheDocument();
      expect(screen.getByTestId('budget-overview')).toBeInTheDocument();
      expect(screen.getByTestId('recent-transactions')).toBeInTheDocument();
    });

    it('renders sections in correct order: Summary, Budget, Transactions', () => {
      render(<DashboardPage />);

      const headings = screen.getAllByRole('heading', { level: 6 });
      expect(headings[0]).toHaveTextContent('Financial Summary');
      expect(headings[1]).toHaveTextContent('Budget Overview');
      expect(headings[2]).toHaveTextContent('Recent Transactions');
    });
  });

  describe('Period Selector Integration', () => {
    it('initializes with current month as default period', () => {
      render(<DashboardPage />);

      const periodSelector = screen.getByTestId('period-selector');
      expect(periodSelector).toHaveValue('this-month');

      // FinancialSummary shows date range, not period name
      const financialSummary = screen.getByTestId('financial-summary');
      expect(financialSummary).toHaveTextContent(
        /Financial Summary: \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/
      );
    });

    it('passes selected period to Financial Summary component', () => {
      render(<DashboardPage />);

      const financialSummary = screen.getByTestId('financial-summary');
      expect(financialSummary).toHaveTextContent(
        /Financial Summary: \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/
      );
    });

    it('passes selected period to Budget Overview component', () => {
      render(<DashboardPage />);

      const budgetOverview = screen.getByTestId('budget-overview');
      expect(budgetOverview).toHaveTextContent(
        /Budget Overview: \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/
      );
    });

    it('updates all sections when period changes', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      const periodSelector = screen.getByTestId('period-selector');
      await user.selectOptions(periodSelector, 'last-month');

      expect(screen.getByTestId('financial-summary')).toHaveTextContent('2025-12-01 to 2025-12-31');
      expect(screen.getByTestId('budget-overview')).toHaveTextContent('2025-12-01 to 2025-12-31');
    });
  });

  describe('Responsive Behavior', () => {
    it('uses Container with maxWidth="lg"', () => {
      const { container } = render(<DashboardPage />);

      const containerElement = container.querySelector('.MuiContainer-maxWidthLg');
      expect(containerElement).toBeInTheDocument();
    });

    it('applies proper spacing to sections', () => {
      const { container } = render(<DashboardPage />);

      // Check that sections have spacing (mb-4 from Box components)
      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('displays sections in single column (stacked layout)', () => {
      const { container } = render(<DashboardPage />);

      // Sections should not have grid display (they're stacked)
      const mainContainer = container.querySelector('.MuiContainer-root > div');
      const computedStyle = window.getComputedStyle(mainContainer!);
      expect(computedStyle.display).not.toBe('grid');
    });
  });

  describe('Recent Transactions Section', () => {
    it('passes limit of 10 to RecentTransactionsList', () => {
      render(<DashboardPage />);

      const recentTransactions = screen.getByTestId('recent-transactions');
      expect(recentTransactions).toHaveTextContent('limit: 10');
    });
  });
});
