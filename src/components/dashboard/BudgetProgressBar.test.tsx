import { render, screen } from '@testing-library/react';
import { BudgetProgressBar } from './BudgetProgressBar';

describe('BudgetProgressBar', () => {
  it('renders budget name and amounts', () => {
    render(<BudgetProgressBar name="Groceries" spent={300} budget={500} />);
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText(/\$300.*\$500/)).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    render(<BudgetProgressBar name="Rent" spent={1500} budget={1500} />);
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('handles zero budget', () => {
    render(<BudgetProgressBar name="Test" spent={100} budget={0} />);
    expect(screen.getByText(/\$100.*\$0/)).toBeInTheDocument();
  });

  it('applies success color for expense under 80%', () => {
    const { container } = render(<BudgetProgressBar name="Food" spent={300} budget={500} />);
    const progressBar = container.querySelector('.MuiLinearProgress-bar');
    expect(progressBar).toBeInTheDocument();
    // 60% usage should be green (success) for expenses
  });

  it('applies warning color for expense between 80-100%', () => {
    const { container } = render(<BudgetProgressBar name="Food" spent={450} budget={500} />);
    const progressBar = container.querySelector('.MuiLinearProgress-bar');
    expect(progressBar).toBeInTheDocument();
    // 90% usage should be yellow (warning) for expenses
  });

  it('applies error color for expense over 100%', () => {
    const { container } = render(<BudgetProgressBar name="Food" spent={600} budget={500} />);
    const progressBar = container.querySelector('.MuiLinearProgress-bar');
    expect(progressBar).toBeInTheDocument();
    // 120% usage should be red (error) for expenses
  });

  it('applies success color for income at 100% or more', () => {
    const { container } = render(
      <BudgetProgressBar name="Salary" spent={3000} budget={3000} isIncome />
    );
    const progressBar = container.querySelector('.MuiLinearProgress-bar');
    expect(progressBar).toBeInTheDocument();
    // 100% income should be green (success)
  });

  it('applies error color for income under 60%', () => {
    const { container } = render(
      <BudgetProgressBar name="Salary" spent={1500} budget={3000} isIncome />
    );
    const progressBar = container.querySelector('.MuiLinearProgress-bar');
    expect(progressBar).toBeInTheDocument();
    // 50% income should be red (error)
  });
});
