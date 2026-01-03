import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeDialog } from './WelcomeDialog';

describe('WelcomeDialog', () => {
  const mockOnOpenLocalFile = jest.fn();
  const mockOnConnectOneDrive = jest.fn();
  const mockOnStartEmpty = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onStartEmpty={mockOnStartEmpty}
      />
    );

    expect(screen.getByText('Welcome to Money Tree')).toBeInTheDocument();
    expect(screen.getByText('Open Local File')).toBeInTheDocument();
    expect(screen.getByText('Connect to OneDrive')).toBeInTheDocument();
    expect(screen.getByText('Start with Empty Data')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <WelcomeDialog
        open={false}
        onOpenLocalFile={mockOnOpenLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onStartEmpty={mockOnStartEmpty}
      />
    );

    expect(screen.queryByText('Welcome to Money Tree')).not.toBeInTheDocument();
  });

  it('should call onOpenLocalFile when Open File button clicked', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onStartEmpty={mockOnStartEmpty}
      />
    );

    const openFileButton = screen.getByRole('button', { name: /open file/i });
    fireEvent.click(openFileButton);

    expect(mockOnOpenLocalFile).toHaveBeenCalledTimes(1);
  });

  it('should call onStartEmpty with false when Start Empty clicked without checkbox', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onStartEmpty={mockOnStartEmpty}
      />
    );

    const startEmptyButton = screen.getByRole('button', { name: /start empty/i });
    fireEvent.click(startEmptyButton);

    expect(mockOnStartEmpty).toHaveBeenCalledWith(false);
  });

  it('should call onStartEmpty with true when Start Empty clicked with checkbox checked', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onStartEmpty={mockOnStartEmpty}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /don't show this dialog again/i });
    fireEvent.click(checkbox);

    const startEmptyButton = screen.getByRole('button', { name: /start empty/i });
    fireEvent.click(startEmptyButton);

    expect(mockOnStartEmpty).toHaveBeenCalledWith(true);
  });

  it('should have OneDrive button disabled', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onStartEmpty={mockOnStartEmpty}
      />
    );

    const oneDriveButton = screen.getByRole('button', { name: /coming soon/i });
    expect(oneDriveButton).toBeDisabled();
  });

  it('should show helper text about changing location later', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onStartEmpty={mockOnStartEmpty}
      />
    );

    expect(
      screen.getByText(/you can change your data storage location later in settings/i)
    ).toBeInTheDocument();
  });

  it('should toggle checkbox state', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onStartEmpty={mockOnStartEmpty}
      />
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /don't show this dialog again/i,
    }) as HTMLInputElement;

    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });
});
