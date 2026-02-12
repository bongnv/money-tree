import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryForm } from './CategoryForm';

describe('CategoryForm', () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<CategoryForm onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByLabelText(/Category Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should show Update button in edit mode', () => {
    const category = { id: 'cat-1', name: 'Food', isDeleted: false, createdAt: '', updatedAt: '' };

    render(<CategoryForm category={category} onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByText('Update')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Food')).toBeInTheDocument();
  });

  it('should call onCancel when Cancel clicked', () => {
    render(<CategoryForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should allow typing in name field', () => {
    render(<CategoryForm onSubmit={onSubmit} onCancel={onCancel} />);

    const nameField = screen.getByLabelText(/Category Name/);
    fireEvent.change(nameField, { target: { value: 'New Category' } });

    expect(screen.getByDisplayValue('New Category')).toBeInTheDocument();
  });

  it('should allow typing in description field', () => {
    render(<CategoryForm onSubmit={onSubmit} onCancel={onCancel} />);

    const descField = screen.getByLabelText(/Description/);
    fireEvent.change(descField, { target: { value: 'A description' } });

    expect(screen.getByDisplayValue('A description')).toBeInTheDocument();
  });
});
