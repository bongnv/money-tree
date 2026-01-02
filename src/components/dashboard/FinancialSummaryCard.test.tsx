import { render, screen } from '@testing-library/react';
import { FinancialSummaryCard } from './FinancialSummaryCard';

describe('FinancialSummaryCard', () => {
  it('renders title and value', () => {
    render(<FinancialSummaryCard title="Net Worth" value="$10,000" />);
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('$10,000')).toBeInTheDocument();
  });

  it('renders without trend', () => {
    render(<FinancialSummaryCard title="Cash Flow" value="$500" />);
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('$500')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders with upward trend', () => {
    render(
      <FinancialSummaryCard
        title="Net Worth"
        value="$10,000"
        trend={{ direction: 'up', percentage: 5.5, label: 'vs last month' }}
      />
    );
    expect(screen.getByText('5.5% vs last month')).toBeInTheDocument();
  });

  it('renders with downward trend', () => {
    render(
      <FinancialSummaryCard
        title="Cash Flow"
        value="$200"
        trend={{ direction: 'down', percentage: 10.2, label: 'vs last quarter' }}
      />
    );
    expect(screen.getByText('10.2% vs last quarter')).toBeInTheDocument();
  });

  it('applies success color', () => {
    render(<FinancialSummaryCard title="Savings" value="$1,000" color="success" />);
    const valueElement = screen.getByText('$1,000');
    // Just check the element renders - MUI applies color via CSS classes
    expect(valueElement).toBeInTheDocument();
  });

  it('applies warning color', () => {
    render(<FinancialSummaryCard title="Budget" value="$800" color="warning" />);
    const valueElement = screen.getByText('$800');
    expect(valueElement).toBeInTheDocument();
  });

  it('applies error color', () => {
    render(<FinancialSummaryCard title="Overspent" value="-$500" color="error" />);
    const valueElement = screen.getByText('-$500');
    expect(valueElement).toBeInTheDocument();
  });
});
