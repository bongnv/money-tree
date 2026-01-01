import { render, screen, fireEvent } from '@testing-library/react';
import { FileLoadErrorDialog } from './FileLoadErrorDialog';

describe('FileLoadErrorDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open with error message', () => {
    render(
      <FileLoadErrorDialog
        open={true}
        error="Failed to parse file"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Failed to Load File')).toBeInTheDocument();
    expect(screen.getByText('Failed to parse file')).toBeInTheDocument();
  });

  it('should render default message when error is null', () => {
    render(
      <FileLoadErrorDialog open={true} error={null} onClose={mockOnClose} />
    );

    expect(
      screen.getByText('An unknown error occurred while loading the file.')
    ).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <FileLoadErrorDialog
        open={false}
        error="Some error"
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Failed to Load File')).not.toBeInTheDocument();
  });

  it('should call onClose when OK button is clicked', () => {
    render(
      <FileLoadErrorDialog
        open={true}
        error="Failed to parse file"
        onClose={mockOnClose}
      />
    );

    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have primary colored OK button', () => {
    render(
      <FileLoadErrorDialog
        open={true}
        error="Failed to parse file"
        onClose={mockOnClose}
      />
    );

    const okButton = screen.getByText('OK').closest('button');
    expect(okButton).toHaveClass('MuiButton-colorPrimary');
    expect(okButton).toHaveClass('MuiButton-contained');
  });
});

