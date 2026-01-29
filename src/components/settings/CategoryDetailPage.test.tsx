import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CategoryDetailPage } from './CategoryDetailPage';
import type { Category, TransactionType } from '../../types/models';

// Mock the hooks
const mockUseCategories = jest.fn();
const mockUseTransactionTypes = jest.fn();
const mockAddTransactionType = jest.fn();
const mockUpdateTransactionType = jest.fn();
const mockDeleteTransactionType = jest.fn();
const mockArchiveTransactionType = jest.fn();
const mockUnarchiveTransactionType = jest.fn();

jest.mock('../../hooks/queries', () => ({
  useCategories: () => mockUseCategories(),
  useTransactionTypes: () => mockUseTransactionTypes(),
  useBaseCurrency: jest.fn(() => 'USD'),
}));

// Mock the navigate function and useParams
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
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

describe('CategoryDetailPage', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Food & Dining',
      description: 'Food related expenses',
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
      group: 'expenses',
      icon: 'restaurant',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'tt-2',
      categoryId: 'cat-1',
      name: 'Restaurants',
      group: 'expenses',
      icon: 'restaurant',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'tt-3',
      categoryId: 'cat-2',
      name: 'Gas',
      group: 'expenses',
      icon: 'local_gas_station',
      isActive: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockGetTransactionTypesByCategory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCategories.mockReturnValue(mockCategories);
    mockUseTransactionTypes.mockReturnValue(mockTransactionTypes);
    mockAddTransactionType.mockResolvedValue(undefined);
    mockUpdateTransactionType.mockResolvedValue(undefined);
    mockDeleteTransactionType.mockResolvedValue(undefined);
    mockArchiveTransactionType.mockResolvedValue(undefined);
    mockUnarchiveTransactionType.mockResolvedValue(undefined);
  });

  const renderComponent = (categoryId = 'cat-1') => {
    mockUseParams.mockReturnValue({ id: categoryId });
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CategoryDetailPage />} />
        </Routes>
      </BrowserRouter>
    );
  };

  describe('Initial Render', () => {
    it('should render category name and description', () => {
      renderComponent('cat-1');

      expect(screen.getAllByText('Food & Dining')[0]).toBeInTheDocument();
      expect(screen.getByText('Food related expenses')).toBeInTheDocument();
    });

    it('should render without description if not provided', () => {
      renderComponent('cat-2');

      expect(screen.getAllByText('Transportation')[0]).toBeInTheDocument();
      expect(screen.queryByText('Food related expenses')).not.toBeInTheDocument();
    });

    it('should render breadcrumbs', () => {
      renderComponent('cat-1');

      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getAllByText('Food & Dining').length).toBeGreaterThan(0);
    });

    it('should render "Back to Categories" button', () => {
      renderComponent('cat-1');

      expect(screen.getByRole('button', { name: /back to categories/i })).toBeInTheDocument();
    });

    it('should render "New Transaction Type" button', () => {
      renderComponent('cat-1');

      expect(screen.getByRole('button', { name: /new transaction type/i })).toBeInTheDocument();
    });

    it('should display transaction types for the category', () => {
      renderComponent('cat-1');

      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Restaurants')).toBeInTheDocument();
      expect(screen.queryByText('Gas')).not.toBeInTheDocument();
    });
  });

  describe('Category Not Found', () => {
    it('should show error message when category does not exist', () => {
      renderComponent('non-existent-id');

      expect(screen.getByText('Category not found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to categories/i })).toBeInTheDocument();
    });

    it('should navigate back when "Back to Categories" is clicked on error page', () => {
      renderComponent('non-existent-id');

      fireEvent.click(screen.getByRole('button', { name: /back to categories/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/settings/categories');
    });
  });

  describe('Navigation', () => {
    it('should navigate back when breadcrumb link is clicked', () => {
      renderComponent('cat-1');

      const breadcrumbLink = screen.getByRole('button', { name: 'Categories' });
      fireEvent.click(breadcrumbLink);

      expect(mockNavigate).toHaveBeenCalledWith('/settings/categories');
    });

    it('should navigate back when "Back to Categories" button is clicked', () => {
      renderComponent('cat-1');

      fireEvent.click(screen.getByRole('button', { name: /back to categories/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/settings/categories');
    });
  });

  describe('Create Transaction Type', () => {
    it('should open dialog when "New Transaction Type" button is clicked', () => {
      renderComponent('cat-1');

      fireEvent.click(screen.getByRole('button', { name: /new transaction type/i }));

      expect(screen.getByText('Add Transaction Type')).toBeInTheDocument();
    });

    it('should add new transaction type when form is submitted', async () => {
      renderComponent('cat-1');

      // Open dialog
      fireEvent.click(screen.getByRole('button', { name: /new transaction type/i }));

      // Fill in form
      const nameInput = screen.getByLabelText(/transaction type name/i);
      fireEvent.change(nameInput, { target: { value: 'New Type' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockAddTransactionType).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mockUUID,
            name: 'New Type',
            isActive: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })
        );
      });
    });

    it('should close dialog after adding transaction type', async () => {
      renderComponent('cat-1');

      // Open dialog
      fireEvent.click(screen.getByRole('button', { name: /new transaction type/i }));

      // Fill in required field
      const nameInput = screen.getByLabelText(/transaction type name/i);
      fireEvent.change(nameInput, { target: { value: 'New Type' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.queryByText('Add Transaction Type')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Transaction Type', () => {
    it('should open dialog with selected transaction type when edit is triggered', () => {
      renderComponent('cat-1');

      const editButton = screen.getByRole('button', { name: /edit groceries/i });
      fireEvent.click(editButton);

      expect(screen.getByText('Edit Transaction Type')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Groceries')).toBeInTheDocument();
    });

    it('should update transaction type when form is submitted', async () => {
      renderComponent('cat-1');

      // Trigger edit
      const editButton = screen.getByRole('button', { name: /edit groceries/i });
      fireEvent.click(editButton);

      // Modify name
      const nameInput = screen.getByLabelText(/transaction type name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Type' } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(mockUpdateTransactionType).toHaveBeenCalledWith(
          'tt-1',
          expect.objectContaining({
            id: 'tt-1',
            name: 'Updated Type',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: expect.any(String),
          })
        );
      });
    });

    it('should close dialog after updating transaction type', () => {
      renderComponent('cat-1');

      // Trigger edit
      fireEvent.click(screen.getByRole('button', { name: /edit groceries/i }));

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      expect(screen.queryByText('Edit Transaction Type')).not.toBeInTheDocument();
    });
  });

  describe('Delete Transaction Type', () => {
    it('should show confirmation dialog when delete is triggered', () => {
      mockConfirm.mockReturnValue(false);
      renderComponent('cat-1');

      const deleteButton = screen.getByRole('button', { name: /delete groceries/i });
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete the transaction type "Groceries"? This action cannot be undone.'
      );
    });

    it('should delete transaction type when confirmed', async () => {
      mockConfirm.mockReturnValue(true);
      renderComponent('cat-1');

      const deleteButton = screen.getByRole('button', { name: /delete groceries/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteTransactionType).toHaveBeenCalledWith('tt-1');
      });
    });

    it('should not delete transaction type when cancelled', () => {
      mockConfirm.mockReturnValue(false);
      renderComponent('cat-1');

      const deleteButton = screen.getByRole('button', { name: /delete groceries/i });
      fireEvent.click(deleteButton);

      expect(mockDeleteTransactionType).not.toHaveBeenCalled();
    });
  });

  describe('Archive/Unarchive Transaction Type', () => {
    it('should archive active transaction type when archive button is clicked', async () => {
      renderComponent('cat-1');

      const archiveButton = screen.getByRole('button', { name: /archive groceries/i });
      fireEvent.click(archiveButton);

      await waitFor(() => {
        expect(mockArchiveTransactionType).toHaveBeenCalledWith('tt-1');
      });
    });

    it('should unarchive inactive transaction type when unarchive button is clicked', async () => {
      renderComponent('cat-2');

      const unarchiveButton = screen.getByRole('button', { name: /unarchive gas/i });
      fireEvent.click(unarchiveButton);

      await waitFor(() => {
        expect(mockUnarchiveTransactionType).toHaveBeenCalledWith('tt-3');
      });
    });
  });

  describe('Close Dialog', () => {
    it('should close dialog when cancel button is clicked', async () => {
      renderComponent('cat-1');

      // Open dialog
      fireEvent.click(screen.getByRole('button', { name: /new transaction type/i }));

      // Close dialog
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should clear selected transaction type when dialog is closed', async () => {
      renderComponent('cat-1');

      // Open for edit
      fireEvent.click(screen.getByRole('button', { name: /edit groceries/i }));
      expect(screen.getByDisplayValue('Groceries')).toBeInTheDocument();

      // Close dialog
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Wait for dialog to completely close (including backdrop)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Open for new - should not have previous data
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /new transaction type/i }));
      });
      const nameInput = screen.getByLabelText(/transaction type name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should render correctly with no transaction types', () => {
      mockGetTransactionTypesByCategory.mockReturnValue([]);
      renderComponent('cat-1');

      expect(screen.getAllByText('Food & Dining')[0]).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new transaction type/i })).toBeInTheDocument();
    });

    it('should handle category with only archived transaction types', () => {
      const archivedTypes: TransactionType[] = [
        {
          id: 'tt-archived',
          categoryId: 'cat-1',
          name: 'Archived Type',
          group: 'expenses',
          icon: 'archive',
          isActive: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockUseTransactionTypes.mockReturnValue(archivedTypes);
      renderComponent('cat-1');

      expect(screen.getByText('Archived Type')).toBeInTheDocument();
    });
  });
});
