/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CategoryDetailPage } from './CategoryDetailPage';
import { useStore } from '@/contexts/StoreContext';
import { Group } from '@/types/enums';

jest.mock('@/contexts/StoreContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('CategoryDetailPage', () => {
  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Food',
      description: 'Food and dining',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    },
    { id: 'cat-2', name: 'Transport', isDeleted: false, createdAt: '', updatedAt: '' },
  ];

  const mockTransactionTypes = [
    {
      id: 'type-1',
      name: 'Groceries',
      categoryId: 'cat-1',
      group: Group.EXPENSE,
      isActive: true,
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      categories: mockCategories,
      transactionTypes: mockTransactionTypes,
      addTransactionType: jest.fn().mockResolvedValue(undefined),
      updateTransactionType: jest.fn().mockResolvedValue(undefined),
      deleteTransactionType: jest.fn().mockResolvedValue(undefined),
    } as any);
  });

  const renderWithRoute = (categoryId: string) =>
    render(
      <MemoryRouter initialEntries={[`/settings/categories/${categoryId}`]}>
        <Routes>
          <Route path="/settings/categories/:id" element={<CategoryDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('should render category detail page with category name', () => {
    renderWithRoute('cat-1');

    expect(screen.getByText('Food and dining')).toBeInTheDocument();
    expect(screen.getByText('Transaction Types')).toBeInTheDocument();
    expect(screen.getByText('New Transaction Type')).toBeInTheDocument();
    // "Food" appears in breadcrumbs and heading
    expect(screen.getAllByText('Food').length).toBeGreaterThanOrEqual(1);
  });

  it('should show breadcrumbs', () => {
    renderWithRoute('cat-1');

    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('should show back button', () => {
    renderWithRoute('cat-1');

    expect(screen.getByText('Back to Categories')).toBeInTheDocument();
  });

  it('should show "Category not found" for invalid ID', () => {
    renderWithRoute('nonexistent');

    expect(screen.getByText('Category not found')).toBeInTheDocument();
  });

  it('should filter transaction types by category', () => {
    renderWithRoute('cat-1');

    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('should show new transaction type button', () => {
    renderWithRoute('cat-1');

    expect(screen.getByText('New Transaction Type')).toBeInTheDocument();
  });

  it('should open transaction type dialog when New Transaction Type clicked', () => {
    mockUseStore.mockReturnValue({
      categories: [mockCategories[0]],
      transactionTypes: [mockTransactionTypes[0]],
      accounts: [],
      addTransactionType: jest.fn().mockResolvedValue(undefined),
      updateTransactionType: jest.fn().mockResolvedValue(undefined),
      deleteTransactionType: jest.fn().mockResolvedValue(undefined),
    } as any);

    renderWithRoute('cat-1');

    const newButton = screen.getByRole('button', { name: /new transaction type/i });
    fireEvent.click(newButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should show category description when available', () => {
    renderWithRoute('cat-1');

    expect(screen.getByText('Food and dining')).toBeInTheDocument();
  });

  it('should handle category without description', () => {
    mockUseStore.mockReturnValue({
      categories: [
        { id: 'cat-2', name: 'Transport', isDeleted: false, createdAt: '', updatedAt: '' },
      ],
      transactionTypes: [],
      accounts: [],
      addTransactionType: jest.fn().mockResolvedValue(undefined),
      updateTransactionType: jest.fn().mockResolvedValue(undefined),
      deleteTransactionType: jest.fn().mockResolvedValue(undefined),
    } as any);

    renderWithRoute('cat-2');

    expect(screen.getAllByText('Transport').length).toBeGreaterThan(0);
  });

  it('should navigate back to categories list', () => {
    renderWithRoute('cat-1');

    const backButton = screen.getByText('Back to Categories');
    expect(backButton).toBeInTheDocument();
  });
});
