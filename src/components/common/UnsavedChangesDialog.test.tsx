import { render, screen, fireEvent } from '@testing-library/react';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

describe('UnsavedChangesDialog', () => {
  const mockOnSave = jest.fn();
  const mockOnDiscard = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <UnsavedChangesDialog
        open={true}
        onSave={mockOnSave}
        onDiscard={mockOnDiscard}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(
      screen.getByText(/Would you like to save them before continuing/)
    ).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <UnsavedChangesDialog
        open={false}
        onSave={mockOnSave}
        onDiscard={mockOnDiscard}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
  });

  it('should call onSave when Save button is clicked', () => {
    render(
      <UnsavedChangesDialog
        open={true}
        onSave={mockOnSave}
        onDiscard={mockOnDiscard}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnDiscard).not.toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should call onDiscard when Discard button is clicked', () => {
    render(
      <UnsavedChangesDialog
        open={true}
        onSave={mockOnSave}
        onDiscard={mockOnDiscard}
        onCancel={mockOnCancel}
      />
    );

    const discardButton = screen.getByText('Discard');
    fireEvent.click(discardButton);

    expect(mockOnDiscard).toHaveBeenCalledTimes(1);
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when Cancel button is clicked', () => {
    render(
      <UnsavedChangesDialog
        open={true}
        onSave={mockOnSave}
        onDiscard={mockOnDiscard}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnDiscard).not.toHaveBeenCalled();
  });

  it('should have correct button colors', () => {
    render(
      <UnsavedChangesDialog
        open={true}
        onSave={mockOnSave}
        onDiscard={mockOnDiscard}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel').closest('button');
    const discardButton = screen.getByText('Discard').closest('button');
    const saveButton = screen.getByText('Save').closest('button');

    expect(cancelButton).toHaveClass('MuiButton-colorInherit');
    expect(discardButton).toHaveClass('MuiButton-colorError');
    expect(saveButton).toHaveClass('MuiButton-colorPrimary');
    expect(saveButton).toHaveClass('MuiButton-contained');
  });
});

