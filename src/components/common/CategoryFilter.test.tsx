import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFilter } from './CategoryFilter';
import type { Category } from '../../types/models';

describe('CategoryFilter', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Food',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'cat2',
      name: 'Transportation',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'cat3',
      name: 'Entertainment',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
  ];

  const mockOnChange = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default label', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Check for the combobox role which is present in Select
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByText('Categories').length).toBeGreaterThan(0);
  });

  it('should render with custom label', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onChange={mockOnChange}
        onClear={mockOnClear}
        label="Filter by Category"
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByText('Filter by Category').length).toBeGreaterThan(0);
  });

  it('should render select with no categories selected initially', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // When no categories are selected, the select should still be rendered
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should display category name when one category selected', async () => {
    const { rerender } = render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Rerender with one category selected
    rerender(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1']}
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('should display count when multiple categories selected', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1', 'cat2']}
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('should open dropdown and show all categories when clicked', async () => {
    const user = userEvent.setup();

    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Click to open the dropdown
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Verify all categories are shown
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Entertainment')).toBeInTheDocument();
  });

  it('should show checkboxes for each category', async () => {
    const user = userEvent.setup();

    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={['cat1']}
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Click to open the dropdown
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Verify checkboxes exist
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);

    // First checkbox should be checked (cat1 is selected)
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  it('should call onChange when category is selected', async () => {
    const user = userEvent.setup();

    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Click to open the dropdown
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Click on a category
    const foodOption = screen.getByText('Food');
    await user.click(foodOption);

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should handle empty categories list', () => {
    render(
      <CategoryFilter
        categories={[]}
        selectedCategories={[]}
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    // Empty categories list should still render the select
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should handle fullWidth prop', () => {
    const { container } = render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategories={[]}
        onChange={mockOnChange}
        onClear={mockOnClear}
        fullWidth={false}
      />
    );

    const formControl = container.querySelector('.MuiFormControl-root');
    expect(formControl).not.toHaveClass('MuiFormControl-fullWidth');
  });
});
