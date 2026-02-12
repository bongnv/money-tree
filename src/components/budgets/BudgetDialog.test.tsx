import { render, screen } from '@/test-utils';
import { BudgetDialog } from './BudgetDialog';
import type { Budget } from '@/types/models';
import { CurrencyCode } from '@/types/enums';

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

  it('should call onClose when Cancel button clicked', () => {
    render(<BudgetDialog open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    cancelButton.click();

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show form fields', () => {
    render(<BudgetDialog open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/transaction type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/period/i)).toBeInTheDocument();
  });

  it('should initialize with budget data in edit mode', () => {
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

    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
  });
});
