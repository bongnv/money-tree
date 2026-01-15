import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CategoriesListPage } from './CategoriesListPage';
import { useCategoryStore } from '../../stores/useCategoryStore';
import type { Category, TransactionType } from '../../types/models';

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

// Mock crypto.randomUUID
const mockUUID = 'mock-uuid-1234';
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => mockUUID),
  },
});

describe('CategoriesListPage', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Food & Dining',
      color: '#FF0000',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'cat-2',
      name: 'Transportation',
      color: '#00FF00',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockTransactionTypes: TransactionType[] = [
    {
      id: 'tt-1',
      categoryId: 'cat-1',
      name: 'Groceries',
      icon: 'restaurant',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockAddCategory = jest.fn();
  const mockUpdateCategory = jest.fn();
  const mockDeleteCategory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useCategoryStore.setState({
      categories: mockCategories,
      transactionTypes: mockTransactionTypes,
      addCategory: mockAddCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <CategoriesListPage />
      </BrowserRouter>
    );
  };

  describe('Initial Render', () => {
    it('should render the page title', () => {
      renderComponent();

      expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
    });

    it('should render "New Category" button', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument();
    });

    it('should render CategoryList with categories', () => {
      renderComponent();

      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
      expect(screen.getByText('Transportation')).toBeInTheDocument();
    });
  });

  describe('Create Category', () => {
    it('should open dialog when "New Category" button is clicked', () => {
      renderComponent();

      const newButton = screen.getByRole('button', { name: /new category/i });
      fireEvent.click(newButton);

      // Dialog should be open
      expect(screen.getByText('Add Category')).toBeInTheDocument();
    });

    it('should add new category when form is submitted', () => {
      renderComponent();

      // Open dialog
      fireEvent.click(screen.getByRole('button', { name: /new category/i }));

      // Fill in form
      const nameInput = screen.getByLabelText(/category name/i);
      fireEvent.change(nameInput, { target: { value: 'New Category' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Should call addCategory
      expect(mockAddCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUUID,
          name: 'New Category',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });

    it('should close dialog after adding category', async () => {
      renderComponent();

      // Open dialog
      fireEvent.click(screen.getByRole('button', { name: /new category/i }));

      // Fill in and submit
      const nameInput = screen.getByLabelText(/category name/i);
      fireEvent.change(nameInput, { target: { value: 'New Category' } });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Add Category')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Category', () => {
    it('should open dialog with selected category when edit is triggered', () => {
      renderComponent();

      // Find and click edit button
      const editButton = screen.getByRole('button', { name: /edit food & dining/i });
      fireEvent.click(editButton);

      // Dialog should open with the category data
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Food & Dining')).toBeInTheDocument();
    });

    it('should update category when form is submitted', () => {
      renderComponent();

      // Trigger edit
      const editButton = screen.getByRole('button', { name: /edit food & dining/i });
      fireEvent.click(editButton);

      // Modify name
      const nameInput = screen.getByLabelText(/category name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Category' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      // Should update category
      expect(mockUpdateCategory).toHaveBeenCalledWith(
        'cat-1',
        expect.objectContaining({
          id: 'cat-1',
          name: 'Updated Category',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: expect.any(String),
        })
      );
    });

    it('should close dialog after updating category', () => {
      renderComponent();

      // Trigger edit
      fireEvent.click(screen.getByRole('button', { name: /edit food & dining/i }));

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      // Dialog should close
      expect(screen.queryByText('Edit Category')).not.toBeInTheDocument();
    });
  });

  describe('Delete Category', () => {
    it('should show confirmation dialog when delete is triggered', () => {
      mockConfirm.mockReturnValue(false);
      renderComponent();

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete food & dining/i });
      fireEvent.click(deleteButton);

      // Should show confirmation
      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete the category "Food & Dining"? This action cannot be undone.'
      );
    });

    it('should delete category when confirmed', () => {
      mockConfirm.mockReturnValue(true);
      renderComponent();

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete food & dining/i });
      fireEvent.click(deleteButton);

      // Should delete category
      expect(mockDeleteCategory).toHaveBeenCalledWith('cat-1');
    });

    it('should not delete category when cancelled', () => {
      mockConfirm.mockReturnValue(false);
      renderComponent();

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete food & dining/i });
      fireEvent.click(deleteButton);

      // Should not delete category
      expect(mockDeleteCategory).not.toHaveBeenCalled();
    });
  });

  describe('Category Navigation', () => {
    it('should navigate to category detail when category is clicked', () => {
      renderComponent();

      // Click on a category card (assuming CategoryList makes cards clickable)
      const categoryCard = screen.getByText('Food & Dining').closest('div');
      if (categoryCard) {
        fireEvent.click(categoryCard);
      }

      // Should navigate to detail page
      expect(mockNavigate).toHaveBeenCalledWith('/settings/categories/cat-1');
    });
  });

  describe('Close Dialog', () => {
    it('should close dialog when close button is clicked', async () => {
      renderComponent();

      // Open dialog
      fireEvent.click(screen.getByRole('button', { name: /new category/i }));

      // Close dialog
      const closeButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(closeButton);

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Add Category')).not.toBeInTheDocument();
      });
    });

    it('should clear selected category when dialog is closed', async () => {
      renderComponent();

      // Open for edit
      fireEvent.click(screen.getByRole('button', { name: /edit food & dining/i }));
      expect(screen.getByDisplayValue('Food & Dining')).toBeInTheDocument();

      // Close dialog
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Wait for dialog to completely close (including backdrop)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Open for new - should not have previous category data
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /new category/i }));
      });
      const nameInput = screen.getByLabelText(/category name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should render correctly with no categories', () => {
      useCategoryStore.setState({ categories: [] });
      renderComponent();

      expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument();
    });

    it('should handle multiple transaction types for a category', () => {
      const multipleTransactionTypes: TransactionType[] = [
        {
          id: 'tt-1',
          categoryId: 'cat-1',
          name: 'Groceries',
          icon: 'restaurant',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'tt-2',
          categoryId: 'cat-1',
          name: 'Restaurants',
          icon: 'restaurant',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      useCategoryStore.setState({ transactionTypes: multipleTransactionTypes });
      renderComponent();

      expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    });
  });
});
