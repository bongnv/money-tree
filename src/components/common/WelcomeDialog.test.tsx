import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeDialog } from './WelcomeDialog';

describe('WelcomeDialog', () => {
  const mockOnOpenLocalFile = jest.fn();
  const mockOnCreateNewLocalFile = jest.fn();
  const mockOnConnectOneDrive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onCreateNewLocalFile={mockOnCreateNewLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onAuthenticateOneDrive={jest.fn()}
      />
    );

    expect(screen.getByText('Welcome to Money Tree')).toBeInTheDocument();
    expect(screen.getByText('Local File Storage')).toBeInTheDocument();
    expect(screen.getByText('Connect to OneDrive')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <WelcomeDialog
        open={false}
        onOpenLocalFile={mockOnOpenLocalFile}
        onCreateNewLocalFile={mockOnCreateNewLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onAuthenticateOneDrive={jest.fn()}
      />
    );

    expect(screen.queryByText('Welcome to Money Tree')).not.toBeInTheDocument();
  });

  it('should call onOpenLocalFile when Open Existing File button clicked', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onCreateNewLocalFile={mockOnCreateNewLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onAuthenticateOneDrive={jest.fn()}
      />
    );

    const openFileButton = screen.getByRole('button', { name: /open existing/i });
    fireEvent.click(openFileButton);

    expect(mockOnOpenLocalFile).toHaveBeenCalledTimes(1);
  });

  it('should call onCreateNewLocalFile when Create New File clicked', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onCreateNewLocalFile={mockOnCreateNewLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onAuthenticateOneDrive={jest.fn()}
      />
    );

    const createFileButton = screen.getByRole('button', { name: /create new/i });
    fireEvent.click(createFileButton);

    expect(mockOnCreateNewLocalFile).toHaveBeenCalledTimes(1);
  });

  it('should show helper text about changing location later', () => {
    render(
      <WelcomeDialog
        open={true}
        onOpenLocalFile={mockOnOpenLocalFile}
        onCreateNewLocalFile={mockOnCreateNewLocalFile}
        onConnectOneDrive={mockOnConnectOneDrive}
        onAuthenticateOneDrive={jest.fn()}
      />
    );

    expect(
      screen.getByText(/you can change your data storage location later in settings/i)
    ).toBeInTheDocument();
  });
});
