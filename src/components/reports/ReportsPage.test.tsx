import { render, screen, fireEvent } from '@testing-library/react';
import { ReportsPage } from './ReportsPage';

// Mock the report components to avoid complex dependencies
jest.mock('./BalanceSheet', () => ({
  BalanceSheet: () => <div data-testid="balance-sheet">Balance Sheet Component</div>,
}));

jest.mock('./CashFlowReport', () => ({
  CashFlowReport: () => <div data-testid="cash-flow-report">Cash Flow Report</div>,
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

  it('Cash Flow tab is enabled', () => {
    render(<ReportsPage />);
    const cashFlowTab = screen.getByRole('tab', { name: /cash flow/i });
    expect(cashFlowTab).not.toBeDisabled();
  });

  it('shows Cash Flow report when tab is clicked', () => {
    render(<ReportsPage />);
    
    const cashFlowTab = screen.getByRole('tab', { name: /cash flow/i });
    fireEvent.click(cashFlowTab);
    
    // Cash Flow report should be visible
    expect(screen.getByTestId('cash-flow-report')).toBeInTheDocument();
  });

  it('Balance Sheet tab is selected by default', () => {
    render(<ReportsPage />);
    const balanceSheetTab = screen.getByRole('tab', { name: /balance sheet/i });
    expect(balanceSheetTab).toHaveAttribute('aria-selected', 'true');
  });
});
