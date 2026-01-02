import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryDialog } from './CategoryDialog';
import { Group } from '../../types/enums';
import type { Category } from '../../types/models';

describe('CategoryDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog for new category', () => {
    render(
      <CategoryDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Add Category')).toBeInTheDocument();
    expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
  });

  it('should render dialog for editing category', () => {
    const category: Category = {
      id: 'cat-1',
      name: 'Groceries',
      group: Group.EXPENSE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(
      <CategoryDialog
        open={true}
        category={category}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Edit Category')).toBeInTheDocument();
    expect(screen.getByLabelText(/category name/i)).toHaveValue('Groceries');
  });

  it('should not render when closed', () => {
    render(
      <CategoryDialog
        open={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByText('Add Category')).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onSubmit and onClose when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <CategoryDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByLabelText(/category name/i), 'Test Category');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
