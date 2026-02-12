import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StorageProviderType } from '@/services/storage/IStorageProvider';
import { WelcomeDialog } from './WelcomeDialog';

// Create mock functions
const mockIsOneDriveConfigured = jest.fn(() => true);

jest.mock('../../config/onedrive.config', () => ({
  isOneDriveConfigured: () => mockIsOneDriveConfigured(),
}));

// Create mock instances
const mockOneDriveProvider = {
  listDriveItems: jest.fn().mockResolvedValue([]),
  setFileInfo: jest.fn().mockResolvedValue(undefined),
};

const mockSyncStatus = {
  status: 'offline' as 'offline' | 'connected' | 'syncing' | 'synced' | 'error',
  errorMessage: null as string | null,
};

let mockProvider: { getName: () => string } | null = null;
const mockCurrentFile: { name: string } | null = null;

const mockConnect = jest.fn().mockImplementation(async (type) => {
  // Set connection state based on the type
  if (type === StorageProviderType.ONEDRIVE) {
    mockProvider = { getName: () => 'OneDrive' };
    mockSyncStatus.status = 'connected';
  }
});

// Mock SyncProvider context
jest.mock('@/contexts/SyncContext', () => {
  const actual = jest.requireActual('@/contexts/SyncContext');
  return {
    ...actual,
    StorageProviderType: actual.StorageProviderType,
    useSync: () => ({
      connect: mockConnect,
      selectFile: jest.fn(),
      fullSync: jest.fn(),
      disconnect: jest.fn(),
      reconnect: jest.fn(),
      status: mockSyncStatus.status,
      errorMessage: mockSyncStatus.errorMessage,
      provider: mockProvider,
      currentFile: mockCurrentFile,
    }),
  };
});

describe('WelcomeDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOneDriveProvider.listDriveItems.mockResolvedValue([]);
  });

  it('should render when open', () => {
    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    expect(screen.getByText('Welcome to Money Tree')).toBeInTheDocument();
    expect(screen.getByText('Connect to OneDrive')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<WelcomeDialog open={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Welcome to Money Tree')).not.toBeInTheDocument();
  });

  it('should not show local storage option', () => {
    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    expect(screen.queryByText('Local File Storage')).not.toBeInTheDocument();
  });

  it('should show helper text about changing location later', () => {
    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    expect(
      screen.getByText(/you can disconnect from this file later in settings/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/by using money tree, you agree to our/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute(
      'href',
      '/terms.html'
    );
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      '/privacy.html'
    );
  });

  describe('OneDrive Integration', () => {
    it('should show OneDrive option when configured', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByText('Connect to OneDrive')).toBeInTheDocument();
      expect(screen.getByText('Sync your data with Microsoft OneDrive')).toBeInTheDocument();
      // OneDrive has a single Connect button
      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      // Should have at least one connect button for OneDrive
      expect(connectButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should show disabled state when OneDrive not configured', () => {
      mockIsOneDriveConfigured.mockReturnValue(false);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      expect(
        screen.getByText('Not configured - Azure app registration required')
      ).toBeInTheDocument();
      // OneDrive buttons should be disabled when not configured
      const allButtons = screen.getAllByRole('button');
      const disabledButtons = allButtons.filter((btn) => btn.hasAttribute('disabled'));
      expect(disabledButtons.length).toBeGreaterThan(0);

      // Reset mock
      mockIsOneDriveConfigured.mockReturnValue(true);
    });

    it('should authenticate and close welcome dialog when OneDrive button clicked', async () => {
      mockConnect.mockResolvedValue(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Connect' buttons and click the first one (OneDrive)
      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
        // Welcome dialog should close and trigger file selection
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error when OneDrive authentication fails', async () => {
      mockConnect.mockRejectedValue(new Error('Auth failed'));

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Connect' buttons and click the first one (OneDrive)
      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Auth failed')).toBeInTheDocument();
      });
    });

    it('should handle OneDrive file selection for existing file', async () => {
      mockConnect.mockResolvedValue(undefined);
      // mockConnect.mockResolvedValue(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Connect' buttons and click the first one (OneDrive)
      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
      });
    });

    it('should handle OneDrive file selection for new file', async () => {
      mockConnect.mockResolvedValue(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Connect' buttons and click the first one (OneDrive)
      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
      });
    });

    it('should disable OneDrive button while connecting', async () => {
      mockConnect.mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Connect' buttons and click the first one (OneDrive)
      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        // The OneDrive Connect button should show "Connecting..." and be disabled
        const connectingButtons = screen.getAllByRole('button', { name: /connecting/i });
        expect(connectingButtons.length).toBeGreaterThanOrEqual(1);
        expect(connectingButtons[0]).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error when new action is taken', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Failed to connect'));

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Trigger error
      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to connect')).toBeInTheDocument();
      });

      // Clear error by starting new action
      mockConnect.mockResolvedValue(undefined);

      const connectButtonsAgain = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtonsAgain[0]);

      await waitFor(() => {
        expect(screen.queryByText('Failed to connect')).not.toBeInTheDocument();
      });
    });

    it('should handle connection error', async () => {
      mockConnect.mockRejectedValue(new Error('Permission denied'));

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument();
      });
    });
  });

  describe('Cloud Storage Integration', () => {
    it('should connect to OneDrive when Connect clicked', async () => {
      mockConnect.mockResolvedValue(undefined);
      mockOneDriveProvider.listDriveItems.mockResolvedValue([]);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
      });
    });

    it('should handle cloud connection errors', async () => {
      mockConnect.mockRejectedValue(new Error('Auth failed'));

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Auth failed')).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should show storage options when dialog opens', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByText('Connect to OneDrive')).toBeInTheDocument();
    });
  });

  describe('User Interaction Flow', () => {
    it('should complete full onboarding flow with OneDrive', async () => {
      mockConnect.mockResolvedValue(undefined);
      mockOneDriveProvider.listDriveItems.mockResolvedValue([]);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // User sees welcome screen
      expect(screen.getByText('Welcome to Money Tree')).toBeInTheDocument();

      // User selects OneDrive
      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
      });
    });

    it('should allow retrying after error', async () => {
      mockConnect
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const connectButtons = screen.getAllByRole('button', { name: /^connect$/i });

      // First attempt fails
      fireEvent.click(connectButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('First attempt failed')).toBeInTheDocument();
      });

      // Second attempt succeeds - need to get fresh button reference
      const connectButtonsAgain = screen.getAllByRole('button', { name: /^connect$/i });
      fireEvent.click(connectButtonsAgain[0]);
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(2);
      });
    });
  });
});
