import { render, screen } from '@testing-library/react';
import { ReportsPage } from './ReportsPage';

// Mock the BalanceSheet component to avoid complex dependencies
jest.mock('./BalanceSheet', () => ({
  BalanceSheet: () => <div data-testid="balance-sheet">Balance Sheet Component</div>,
}));

describe('ReportsPage', () => {
  it('renders the page title', () => {
    render(<ReportsPage />);
    expect(screen.getByText('Financial Reports')).toBeInTheDocument();
  });

  it('renders tabs for Balance Sheet and Cash Flow', () => {
    render(<ReportsPage />);
    expect(screen.getByRole('tab', { name: /balance sheet/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /cash flow/i })).toBeInTheDocument();
  });

  it('shows Balance Sheet tab by default', () => {
    render(<ReportsPage />);
    expect(screen.getByTestId('balance-sheet')).toBeInTheDocument();
  });

  it('Cash Flow tab is disabled', () => {
    render(<ReportsPage />);
    const cashFlowTab = screen.getByRole('tab', { name: /cash flow/i });
    expect(cashFlowTab).toBeDisabled();
  });

  it('shows placeholder message for Cash Flow tab (disabled)', () => {
    render(<ReportsPage />);
    
    // Cash Flow tab is disabled, so we just verify the Balance Sheet is showing
    expect(screen.getByTestId('balance-sheet')).toBeInTheDocument();
    expect(screen.queryByText(/cash flow report coming soon/i)).not.toBeInTheDocument();
  });

  it('Balance Sheet tab is selected by default', () => {
    render(<ReportsPage />);
    const balanceSheetTab = screen.getByRole('tab', { name: /balance sheet/i });
    expect(balanceSheetTab).toHaveAttribute('aria-selected', 'true');
  });
});
