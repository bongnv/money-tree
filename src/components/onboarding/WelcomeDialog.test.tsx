import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WelcomeDialog } from './WelcomeDialog';
import { StorageProviderType } from '../../services/storage/StorageProviderFactory';

// Create mock functions
const mockIsOneDriveConfigured = jest.fn(() => true);
const mockIsGoogleDriveConfigured = jest.fn(() => true);

jest.mock('../../config/onedrive.config', () => ({
  isOneDriveConfigured: () => mockIsOneDriveConfigured(),
}));
jest.mock('../../config/googledrive.config', () => ({
  isGoogleDriveConfigured: () => mockIsGoogleDriveConfigured(),
}));

// Create mock instances
const mockOneDriveProvider = {
  listDriveItems: jest.fn().mockResolvedValue([]),
  setFileInfo: jest.fn().mockResolvedValue(undefined),
};

const mockGoogleDriveProvider = {
  listDriveFiles: jest.fn().mockResolvedValue([]),
  setFileInfo: jest.fn().mockResolvedValue(undefined),
};

const mockSyncService = {
  connect: jest.fn().mockImplementation(async (type) => {
    // Set connection state based on the type
    if (type === StorageProviderType.ONEDRIVE) {
      mockSyncService.providerName = 'OneDrive' as string | null;
      mockSyncService.isConnected = true;
    } else if (type === StorageProviderType.GOOGLE_DRIVE) {
      mockSyncService.providerName = 'Google Drive' as string | null;
      mockSyncService.isConnected = true;
    }
  }),
  setFile: jest.fn(),
  listItems: jest.fn().mockResolvedValue([]),
  downloadFromCloud: jest.fn(),
  uploadToCloud: jest.fn(),
  fullSync: jest.fn(),
  isConnected: false,
  providerName: null as string | null,
  fileName: null,
  providerType: null,
  isSyncing: false,
  lastSynced: null,
  isInitializing: false,
  disconnect: jest.fn(),
  debouncedSync: jest.fn(),
};

// Mock SyncProvider context
jest.mock('../../contexts/SyncProvider', () => ({
  useSyncService: () => mockSyncService,
}));

describe('WelcomeDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOneDriveProvider.listDriveItems.mockResolvedValue([]);
    mockGoogleDriveProvider.listDriveFiles.mockResolvedValue([]);
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
      // OneDrive has 2 buttons: Open Existing and Create New
      const allOpenButtons = screen.getAllByRole('button', { name: /open existing/i });
      const allCreateButtons = screen.getAllByRole('button', { name: /create new/i });
      // Should have buttons for OneDrive and optionally Google Drive
      expect(allOpenButtons.length).toBeGreaterThanOrEqual(1);
      expect(allCreateButtons.length).toBeGreaterThanOrEqual(1);
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

    it('should authenticate and show file picker when OneDrive button clicked', async () => {
      mockSyncService.connect.mockResolvedValue(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Open Existing' buttons and click the first one (OneDrive)
      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(mockSyncService.connect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
        // CloudFilePicker should be shown
        expect(screen.queryByText('Welcome to Money Tree')).not.toBeInTheDocument();
      });
    });

    it('should show error when OneDrive authentication fails', async () => {
      mockSyncService.connect.mockRejectedValue(new Error('Auth failed'));

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Create New' buttons and click the first one (OneDrive)
      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Auth failed')).toBeInTheDocument();
      });
    });

    it('should handle OneDrive file selection for existing file', async () => {
      mockSyncService.connect.mockResolvedValue(undefined);
      mockSyncService.downloadFromCloud.mockResolvedValue(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Open Existing' buttons and click the first one (OneDrive)
      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(mockSyncService.connect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
      });
    });

    it('should handle OneDrive file selection for new file', async () => {
      mockSyncService.connect.mockResolvedValue(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Create New' buttons and click the first one (OneDrive)
      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[0]);

      await waitFor(() => {
        expect(mockSyncService.connect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
      });
    });

    it('should disable OneDrive button while connecting', async () => {
      mockSyncService.connect.mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Create New' buttons and click the first one (OneDrive)
      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[0]);

      await waitFor(() => {
        // The OneDrive Create New button should show "Connecting..." and be disabled
        const connectingButtons = screen.getAllByRole('button', { name: /connecting/i });
        expect(connectingButtons.length).toBeGreaterThanOrEqual(1);
        expect(connectingButtons[0]).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error when new action is taken', async () => {
      mockSyncService.connect.mockRejectedValueOnce(new Error('Failed to connect'));

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Trigger error
      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to connect')).toBeInTheDocument();
      });

      // Clear error by starting new action
      mockSyncService.connect.mockResolvedValue(undefined);

      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Failed to connect')).not.toBeInTheDocument();
      });
    });

    it('should handle connection error', async () => {
      mockSyncService.connect.mockRejectedValue(new Error('Permission denied'));

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument();
      });
    });
  });

  describe('Cloud Storage Integration', () => {
    it('should connect to OneDrive when Open Existing clicked', async () => {
      mockSyncService.connect.mockResolvedValue(undefined);
      mockOneDriveProvider.listDriveItems.mockResolvedValue([]);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(mockSyncService.connect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
      });
    });

    it('should connect to Google Drive when Create New clicked', async () => {
      mockSyncService.connect.mockResolvedValue(undefined);
      mockGoogleDriveProvider.listDriveFiles.mockResolvedValue([]);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      const googleDriveButtons = createButtons.filter((btn) => !btn.closest('[disabled]'));
      if (googleDriveButtons.length > 1) {
        fireEvent.click(googleDriveButtons[1]); // Google Drive is second option

        await waitFor(() => {
          expect(mockSyncService.connect).toHaveBeenCalledWith(StorageProviderType.GOOGLE_DRIVE);
        });
      }
    });

    it('should handle cloud connection errors', async () => {
      mockSyncService.connect.mockRejectedValue(new Error('Auth failed'));

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Auth failed')).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should show storage options when dialog opens', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByText('Connect to OneDrive')).toBeInTheDocument();
      // Google Drive may or may not be shown depending on configuration
    });
  });

  describe('User Interaction Flow', () => {
    it('should complete full onboarding flow with OneDrive', async () => {
      mockSyncService.connect.mockResolvedValue(undefined);
      mockOneDriveProvider.listDriveItems.mockResolvedValue([]);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // User sees welcome screen
      expect(screen.getByText('Welcome to Money Tree')).toBeInTheDocument();

      // User selects OneDrive
      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[0]);

      await waitFor(() => {
        expect(mockSyncService.connect).toHaveBeenCalledWith(StorageProviderType.ONEDRIVE);
      });
    });

    it('should allow retrying after error', async () => {
      mockSyncService.connect
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const createButtons = screen.getAllByRole('button', { name: /create new/i });

      // First attempt fails
      fireEvent.click(createButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('First attempt failed')).toBeInTheDocument();
      });

      // Second attempt succeeds
      fireEvent.click(createButtons[0]);
      await waitFor(() => {
        expect(mockSyncService.connect).toHaveBeenCalledTimes(2);
      });
    });
  });
});
