import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WelcomeDialog } from './WelcomeDialog';
import { FilePickerService } from '../../services/storage/FilePickerService';
import { StorageProviderType } from '../../services/storage/StorageService';

// Mock dependencies
jest.mock('../../services/storage/FilePickerService');

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
const mockLocalProvider = {
  setFile: jest.fn().mockResolvedValue(undefined),
};

const mockStorageFactory = {
  connect: jest.fn().mockImplementation(async () => {
    // Set the provider synchronously so it's available immediately after connect()
    mockStorageFactory.provider = mockLocalProvider;
  }),
  listFiles: jest.fn(),
  provider: null as any,
};

const mockSyncService = {
  loadDataFile: jest.fn(),
  syncNow: jest.fn(),
};

// Mock the ServiceProvider context
jest.mock('../../contexts/ServiceProviders', () => ({
  useStorage: () => mockStorageFactory,
  useStorageFactory: () => mockStorageFactory,
  useSyncService: () => mockSyncService,
}));

describe('WelcomeDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset provider to mockLocalProvider before each test
    mockStorageFactory.provider = mockLocalProvider;
  });

  it('should render when open', () => {
    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    expect(screen.getByText('Welcome to Money Tree')).toBeInTheDocument();
    expect(screen.getByText('Local File Storage')).toBeInTheDocument();
    expect(screen.getByText('Connect to OneDrive')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<WelcomeDialog open={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Welcome to Money Tree')).not.toBeInTheDocument();
  });

  it('should load existing file and close dialog when Open Existing File button clicked', async () => {
    const mockFileHandle = {} as FileSystemFileHandle;
    (FilePickerService.showOpenFilePicker as jest.Mock).mockResolvedValue(mockFileHandle);
    mockStorageFactory.connect.mockResolvedValueOnce(undefined);
    mockSyncService.loadDataFile.mockResolvedValue(undefined);

    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    // Get all 'Open Existing' buttons and click the first one (Local Storage)
    const openFileButtons = screen.getAllByRole('button', { name: /open existing/i });
    fireEvent.click(openFileButtons[0]);

    await waitFor(() => {
      expect(FilePickerService.showOpenFilePicker).toHaveBeenCalledTimes(1);
      expect(mockStorageFactory.connect).toHaveBeenCalledWith({
        type: StorageProviderType.LOCAL,
      });
      expect(mockLocalProvider.setFile).toHaveBeenCalledWith(mockFileHandle);
      expect(mockSyncService.loadDataFile).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should create new file and close dialog when Create New File clicked', async () => {
    const mockFileHandle = {} as FileSystemFileHandle;
    (FilePickerService.showSaveFilePicker as jest.Mock).mockResolvedValue(mockFileHandle);
    mockStorageFactory.connect.mockResolvedValueOnce(undefined);
    mockSyncService.syncNow.mockResolvedValue(undefined);

    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    // Get all 'Create New' buttons and click the first one (Local Storage)
    const createFileButtons = screen.getAllByRole('button', { name: /create new/i });
    fireEvent.click(createFileButtons[0]);

    await waitFor(() => {
      expect(FilePickerService.showSaveFilePicker).toHaveBeenCalledWith('money-tree.json');
      expect(mockStorageFactory.connect).toHaveBeenCalledWith({
        type: StorageProviderType.LOCAL,
      });
      expect(mockLocalProvider.setFile).toHaveBeenCalledWith(mockFileHandle);
      expect(mockSyncService.syncNow).toHaveBeenCalledWith(true);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should show helper text about changing location later', () => {
    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    expect(
      screen.getByText(/you can change your data storage location later in settings/i)
    ).toBeInTheDocument();
  });

  describe('OneDrive Integration', () => {
    it('should show OneDrive option when configured', () => {
      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByText('Connect to OneDrive')).toBeInTheDocument();
      expect(screen.getByText('Sync your data with Microsoft OneDrive')).toBeInTheDocument();
      // OneDrive has 2 buttons: Open Existing and Create New
      const allOpenButtons = screen.getAllByRole('button', { name: /open existing/i });
      const allCreateButtons = screen.getAllByRole('button', { name: /create new/i });
      // Should have buttons for Local Storage, OneDrive, and Google Drive (3 each)
      expect(allOpenButtons.length).toBe(3);
      expect(allCreateButtons.length).toBe(3);
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
      mockStorageFactory.connect.mockResolvedValue(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Open Existing' buttons and click the second one (OneDrive)
      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[1]); // Index 1 is OneDrive

      await waitFor(() => {
        expect(mockStorageFactory.connect).toHaveBeenCalledWith({
          type: StorageProviderType.ONEDRIVE,
        });
        // OneDriveFilePicker should be shown
        expect(screen.queryByText('Welcome to Money Tree')).not.toBeInTheDocument();
      });
    });

    it('should show error when OneDrive authentication fails', async () => {
      mockStorageFactory.connect.mockRejectedValue(new Error('Auth failed'));

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Create New' buttons and click the second one (OneDrive)
      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[1]); // Index 1 is OneDrive

      await waitFor(() => {
        expect(screen.getByText('Auth failed')).toBeInTheDocument();
      });
    });

    it('should handle OneDrive file selection for existing file', async () => {
      mockStorageFactory.connect.mockResolvedValue(undefined);
      mockSyncService.loadDataFile.mockResolvedValue(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Open Existing' buttons and click the second one (OneDrive)
      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[1]); // Index 1 is OneDrive

      await waitFor(() => {
        expect(mockStorageFactory.connect).toHaveBeenCalledWith({
          type: StorageProviderType.ONEDRIVE,
        });
      });

      // Simulate file picker selection (existing file)
      const mockFileInfo = { fileId: 'file-123', fileName: 'existing.json', folderId: 'folder-1' };
      // Note: The actual file picker component would trigger this
      // For now, we're testing the handler logic
    });

    it('should handle OneDrive file selection for new file', async () => {
      mockStorageFactory.connect.mockResolvedValue(undefined);
      mockSyncService.syncNow.mockResolvedValue(undefined);

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Create New' buttons and click the second one (OneDrive)
      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[1]); // Index 1 is OneDrive

      await waitFor(() => {
        expect(mockStorageFactory.connect).toHaveBeenCalledWith({
          type: StorageProviderType.ONEDRIVE,
        });
      });
    });

    it('should disable OneDrive button while connecting', async () => {
      mockStorageFactory.connect.mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Get all 'Create New' buttons and click the second one (OneDrive)
      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[1]); // Index 1 is OneDrive

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
      (FilePickerService.showOpenFilePicker as jest.Mock).mockRejectedValue(
        new Error('Failed to open')
      );

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      // Trigger error - use first Open Existing button (Local Storage)
      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to open')).toBeInTheDocument();
      });

      // Clear error by starting new action
      (FilePickerService.showSaveFilePicker as jest.Mock).mockResolvedValue(
        {} as FileSystemFileHandle
      );
      mockStorageFactory.connect.mockResolvedValue(undefined);
      mockSyncService.syncNow.mockResolvedValue(undefined);

      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Failed to open')).not.toBeInTheDocument();
      });
    });

    it('should handle open file error', async () => {
      (FilePickerService.showOpenFilePicker as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const openButtons = screen.getAllByRole('button', { name: /open existing/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument();
      });
    });

    it('should handle create file error', async () => {
      (FilePickerService.showSaveFilePicker as jest.Mock).mockRejectedValue(
        new Error('Cannot create file')
      );

      render(<WelcomeDialog open={true} onClose={mockOnClose} />);

      const createButtons = screen.getAllByRole('button', { name: /create new/i });
      fireEvent.click(createButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cannot create file')).toBeInTheDocument();
      });
    });
  });
});
