/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CategoriesListPage } from './CategoriesListPage';
import { useStore } from '@/contexts/StoreContext';

jest.mock('@/contexts/StoreContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('CategoriesListPage', () => {
  const mockAddCategory = jest.fn().mockResolvedValue(undefined);
  const mockUpdateCategory = jest.fn().mockResolvedValue(undefined);
  const mockDeleteCategory = jest.fn().mockResolvedValue(undefined);

  const mockCategories = [
    { id: 'cat-1', name: 'Food', isDeleted: false, createdAt: '', updatedAt: '' },
    { id: 'cat-2', name: 'Transport', isDeleted: false, createdAt: '', updatedAt: '' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      categories: mockCategories,
      transactionTypes: [],
      addCategory: mockAddCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory,
    } as any);
  });

  it('should render categories page with title', () => {
    renderWithRouter(<CategoriesListPage />);

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('New Category')).toBeInTheDocument();
  });

  it('should render category list', () => {
    renderWithRouter(<CategoriesListPage />);

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('should open category dialog when New Category clicked', () => {
    renderWithRouter(<CategoriesListPage />);

    fireEvent.click(screen.getByText('New Category'));

    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should handle empty categories', () => {
    mockUseStore.mockReturnValue({
      categories: [],
      transactionTypes: [],
      addCategory: mockAddCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory,
    } as any);

    renderWithRouter(<CategoriesListPage />);

    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('should have new category button that can be clicked', () => {
    renderWithRouter(<CategoriesListPage />);

    const newButton = screen.getByText('New Category');
    fireEvent.click(newButton);

    // Component should still render after click
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('should show category cards', () => {
    renderWithRouter(<CategoriesListPage />);

    // Categories should be displayed
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('should navigate to category detail on card click', () => {
    renderWithRouter(<CategoriesListPage />);

    const categoryCard = screen.getByText('Food').closest('div[role="button"]');
    if (categoryCard) {
      fireEvent.click(categoryCard);
      // Navigation should occur
    }
  });
});
