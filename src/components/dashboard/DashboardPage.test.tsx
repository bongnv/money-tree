import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';

// Mock child components
jest.mock('./PeriodSelector', () => ({
  PeriodSelector: ({ value, onChange }: any) => (
    <select
      data-testid="period-selector"
      value={value.label}
      onChange={(e) =>
        onChange({
          label: e.target.value,
          startDate: value.startDate,
          endDate: value.endDate,
        })
      }
    >
      <option value="This Month">This Month</option>
      <option value="Last Month">Last Month</option>
    </select>
  ),
}));

jest.mock('./FinancialSummary', () => ({
  FinancialSummary: ({ period }: any) => (
    <div data-testid="financial-summary">Financial Summary: {period.label}</div>
  ),
}));

jest.mock('./BudgetOverview', () => ({
  BudgetOverview: ({ period }: any) => (
    <div data-testid="budget-overview">Budget Overview: {period.label}</div>
  ),
}));

jest.mock('./RecentTransactionsList', () => ({
  RecentTransactionsList: ({ limit }: any) => (
    <div data-testid="recent-transactions">Recent Transactions (limit: {limit})</div>
  ),
}));

jest.mock('./QuickEntryContainer', () => ({
  QuickEntryContainer: () => <div data-testid="quick-entry">Quick Entry Form</div>,
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
      expect(periodSelector).toHaveValue('This Month');
    });

    it('renders all child components', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('financial-summary')).toBeInTheDocument();
      expect(screen.getByTestId('budget-overview')).toBeInTheDocument();
      expect(screen.getByTestId('quick-entry')).toBeInTheDocument();
      expect(screen.getByTestId('recent-transactions')).toBeInTheDocument();
    });

    it('renders sections in correct order: Summary, Budget, Transactions', () => {
      render(<DashboardPage />);

      const headings = screen.getAllByRole('heading', { level: 6 });
      expect(headings[0]).toHaveTextContent('Financial Summary');
      expect(headings[1]).toHaveTextContent('Budget Overview');
      expect(headings[2]).toHaveTextContent('Recent Transactions');
    });

    it('renders quick entry form inside a Paper component', () => {
      render(<DashboardPage />);

      const quickEntry = screen.getByTestId('quick-entry');
      const paper = quickEntry.closest('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });

  describe('Period Selector Integration', () => {
    it('initializes with current month as default period', () => {
      render(<DashboardPage />);

      const periodSelector = screen.getByTestId('period-selector');
      expect(periodSelector).toHaveValue('This Month');

      const financialSummary = screen.getByTestId('financial-summary');
      expect(financialSummary).toHaveTextContent('This Month');
    });

    it('passes selected period to Financial Summary component', () => {
      render(<DashboardPage />);

      const financialSummary = screen.getByTestId('financial-summary');
      expect(financialSummary).toHaveTextContent('Financial Summary: This Month');
    });

    it('passes selected period to Budget Overview component', () => {
      render(<DashboardPage />);

      const budgetOverview = screen.getByTestId('budget-overview');
      expect(budgetOverview).toHaveTextContent('Budget Overview: This Month');
    });

    it('updates all sections when period changes', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      const periodSelector = screen.getByTestId('period-selector');
      await user.selectOptions(periodSelector, 'Last Month');

      expect(screen.getByTestId('financial-summary')).toHaveTextContent('Last Month');
      expect(screen.getByTestId('budget-overview')).toHaveTextContent('Last Month');
    });

    it('maintains period state across component updates', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<DashboardPage />);

      const periodSelector = screen.getByTestId('period-selector');
      await user.selectOptions(periodSelector, 'Last Month');

      rerender(<DashboardPage />);

      expect(screen.getByTestId('period-selector')).toHaveValue('Last Month');
      expect(screen.getByTestId('financial-summary')).toHaveTextContent('Last Month');
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
    it('displays quick entry form above recent transactions list', () => {
      render(<DashboardPage />);

      const recentSection = screen.getByText('Recent Transactions').closest('div');
      const quickEntry = within(recentSection!).getByTestId('quick-entry');
      const recentList = within(recentSection!).getByTestId('recent-transactions');

      // Quick entry should come before recent list in DOM order
      expect(quickEntry.compareDocumentPosition(recentList)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('passes limit of 10 to RecentTransactionsList', () => {
      render(<DashboardPage />);

      const recentTransactions = screen.getByTestId('recent-transactions');
      expect(recentTransactions).toHaveTextContent('limit: 10');
    });

    it('quick entry and recent list are separate components', () => {
      render(<DashboardPage />);

      const quickEntry = screen.getByTestId('quick-entry');
      const recentList = screen.getByTestId('recent-transactions');

      expect(quickEntry).not.toBe(recentList);
      expect(quickEntry.parentElement).not.toBe(recentList.parentElement);
    });
  });
});
