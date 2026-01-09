import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickEntryAutocomplete } from './QuickEntryAutocomplete';

describe('QuickEntryAutocomplete', () => {
  const mockOptions = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
    { id: '3', name: 'Another Option' },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with placeholder', () => {
    render(
      <QuickEntryAutocomplete
        options={mockOptions}
        value={null}
        onChange={mockOnChange}
        getOptionLabel={(option) => option.name}
        placeholder="Select option"
      />
    );

    expect(screen.getByPlaceholderText('Select option')).toBeInTheDocument();
  });

  it('should display selected value', () => {
    render(
      <QuickEntryAutocomplete
        options={mockOptions}
        value={mockOptions[0]}
        onChange={mockOnChange}
        getOptionLabel={(option) => option.name}
      />
    );

    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
  });

  it('should call onChange when option is selected', () => {
    render(
      <QuickEntryAutocomplete
        options={mockOptions}
        value={null}
        onChange={mockOnChange}
        getOptionLabel={(option) => option.name}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'Option 1' } });

    const option = screen.getByText('Option 1');
    fireEvent.click(option);

    expect(mockOnChange).toHaveBeenCalledWith(mockOptions[0]);
  });

  it('should auto-select single filtered result on Enter', () => {
    render(
      <QuickEntryAutocomplete
        options={mockOptions}
        value={null}
        onChange={mockOnChange}
        getOptionLabel={(option) => option.name}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'Another' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith(mockOptions[2]);
  });

  it('should select first match when multiple options match', () => {
    render(
      <QuickEntryAutocomplete
        options={mockOptions}
        value={null}
        onChange={mockOnChange}
        getOptionLabel={(option) => option.name}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'Option' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should select first matching option
    expect(mockOnChange).toHaveBeenCalledWith(mockOptions[0]);
  });

  it('should not auto-select when no input value', () => {
    render(
      <QuickEntryAutocomplete
        options={mockOptions}
        value={null}
        onChange={mockOnChange}
        getOptionLabel={(option) => option.name}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should display error state', () => {
    render(
      <QuickEntryAutocomplete
        options={mockOptions}
        value={null}
        onChange={mockOnChange}
        getOptionLabel={(option) => option.name}
        error={true}
        helperText="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should support groupBy prop', () => {
    const groupedOptions = [
      { id: '1', name: 'Item 1', category: 'Category A' },
      { id: '2', name: 'Item 2', category: 'Category A' },
      { id: '3', name: 'Item 3', category: 'Category B' },
    ];

    render(
      <QuickEntryAutocomplete
        options={groupedOptions}
        value={null}
        onChange={mockOnChange}
        getOptionLabel={(option) => option.name}
        groupBy={(option) => option.category}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    // Check that categories appear as group headers
    expect(screen.getByText('Category A')).toBeInTheDocument();
    expect(screen.getByText('Category B')).toBeInTheDocument();
  });
});
