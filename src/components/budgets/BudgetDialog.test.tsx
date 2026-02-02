import { render, screen } from '@/test-utils';
import { BudgetDialog } from './BudgetDialog';
import type { Budget } from '../../types/models';
import { CurrencyCode } from '../../types/enums';

describe('BudgetDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with "Add Budget" title when no budget provided', () => {
    render(<BudgetDialog open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Add Budget')).toBeInTheDocument();
  });

  it('should render with "Edit Budget" title when budget provided', () => {
    const mockBudget: Budget = {
      id: 'budget-1',
      transactionTypeId: 'type-1',
      amount: 500,
      currencyCode: CurrencyCode.USD,
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isDeleted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    render(
      <BudgetDialog open={true} budget={mockBudget} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    expect(screen.getByText('Edit Budget')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    const { container } = render(
      <BudgetDialog open={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
