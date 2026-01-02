import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriesPage } from './CategoriesPage';
import { Group } from '../../types/enums';

// Mock the store
const mockAddCategory = jest.fn();
const mockUpdateCategory = jest.fn();
const mockDeleteCategory = jest.fn();
const mockAddTransactionType = jest.fn();
const mockUpdateTransactionType = jest.fn();
const mockDeleteTransactionType = jest.fn();
const mockGetTransactionTypesByCategory = jest.fn();

jest.mock('../../stores/useCategoryStore', () => ({
  useCategoryStore: () => ({
    categories: [
      {
        id: 'cat-1',
        name: 'Groceries',
        group: Group.EXPENSE,
        description: 'Food and household items',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat-2',
        name: 'Salary',
        group: Group.INCOME,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    transactionTypes: [
      {
        id: 'tt-1',
        name: 'Supermarket',
        categoryId: 'cat-1',
        description: 'Grocery shopping',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    addCategory: mockAddCategory,
    updateCategory: mockUpdateCategory,
    deleteCategory: mockDeleteCategory,
    addTransactionType: mockAddTransactionType,
    updateTransactionType: mockUpdateTransactionType,
    deleteTransactionType: mockDeleteTransactionType,
    getTransactionTypesByCategory: mockGetTransactionTypesByCategory,
  }),
}));

describe('CategoriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactionTypesByCategory.mockReturnValue([]);
    // Mock alert
    global.alert = jest.fn();
  });

  it('should render page title and tabs', () => {
    render(<CategoriesPage />);

    expect(screen.getByText('Categories & Transaction Types')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /categories/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /transaction types/i })).toBeInTheDocument();
  });

  it('should show categories by default', () => {
    render(<CategoriesPage />);

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument();
  });

  it('should switch to transaction types tab', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    const transactionTypesTab = screen.getByRole('tab', { name: /transaction types/i });
    await user.click(transactionTypesTab);

    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new transaction type/i })).toBeInTheDocument();
  });

  it('should open category dialog when new category button is clicked', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    const newButton = screen.getByRole('button', { name: /new category/i });
    await user.click(newButton);

    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  it('should open transaction type dialog when new transaction type button is clicked', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    // Switch to transaction types tab
    const transactionTypesTab = screen.getByRole('tab', { name: /transaction types/i });
    await user.click(transactionTypesTab);

    const newButton = screen.getByRole('button', { name: /new transaction type/i });
    await user.click(newButton);

    expect(screen.getByText('Add Transaction Type')).toBeInTheDocument();
  });

  it('should add a new category', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    const newButton = screen.getByRole('button', { name: /new category/i });
    await user.click(newButton);

    await user.type(screen.getByLabelText(/category name/i), 'Transportation');
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddCategory).toHaveBeenCalled();
    });
  });

  it('should add a new transaction type', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    // Switch to transaction types tab
    const transactionTypesTab = screen.getByRole('tab', { name: /transaction types/i });
    await user.click(transactionTypesTab);

    const newButton = screen.getByRole('button', { name: /new transaction type/i });
    await user.click(newButton);

    await user.type(screen.getByLabelText(/transaction type name/i), 'Restaurant');
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByRole('option', { name: /groceries/i }));

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddTransactionType).toHaveBeenCalled();
    });
  });

  it('should show delete confirmation for category', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    const deleteButton = screen.getAllByLabelText(/delete/i)[0];
    await user.click(deleteButton);

    expect(screen.getByText('Delete Category')).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('should delete category when confirmed', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    const deleteButton = screen.getAllByLabelText(/delete/i)[0];
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /delete/i, hidden: false });
    await user.click(confirmButton);

    expect(mockDeleteCategory).toHaveBeenCalled();
  });

  it('should prevent category deletion if it has transaction types', async () => {
    mockGetTransactionTypesByCategory.mockReturnValue([
      {
        id: 'tt-1',
        name: 'Supermarket',
        categoryId: 'cat-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    const user = userEvent.setup();
    render(<CategoriesPage />);

    const deleteButton = screen.getAllByLabelText(/delete groceries/i)[0];
    await user.click(deleteButton);

    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Cannot delete category'));
    expect(mockDeleteCategory).not.toHaveBeenCalled();
  });

  it('should show delete confirmation for transaction type', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    // Switch to transaction types tab
    const transactionTypesTab = screen.getByRole('tab', { name: /transaction types/i });
    await user.click(transactionTypesTab);

    const deleteButton = screen.getByLabelText(/delete supermarket/i);
    await user.click(deleteButton);

    expect(screen.getByText('Delete Transaction Type')).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('should delete transaction type when confirmed', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    // Switch to transaction types tab
    const transactionTypesTab = screen.getByRole('tab', { name: /transaction types/i });
    await user.click(transactionTypesTab);

    const deleteButton = screen.getByLabelText(/delete supermarket/i);
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /delete/i, hidden: false });
    await user.click(confirmButton);

    expect(mockDeleteTransactionType).toHaveBeenCalled();
  });

  it('should close dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    const newButton = screen.getByRole('button', { name: /new category/i });
    await user.click(newButton);

    expect(screen.getByText('Add Category')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Add Category')).not.toBeInTheDocument();
    });
  });
});
