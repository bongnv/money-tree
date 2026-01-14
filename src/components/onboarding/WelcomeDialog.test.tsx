import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WelcomeDialog } from './WelcomeDialog';
import { FilePickerService } from '../../services/storage/FilePickerService';
import { StorageProviderType } from '../../services/storage/StorageFactory';

// Mock dependencies
jest.mock('../../services/storage/FilePickerService');
jest.mock('../../config/onedrive.config', () => ({
  isOneDriveConfigured: jest.fn(() => true),
}));
jest.mock('../../config/googledrive.config', () => ({
  isGoogleDriveConfigured: jest.fn(() => true),
}));

// Create mock instances
const mockStorageFactory = {
  replaceProvider: jest.fn(),
  authenticateOneDrive: jest.fn(),
  authenticateGoogleDrive: jest.fn(),
  showGoogleDriveFilePicker: jest.fn(),
  listOneDriveFolders: jest.fn(),
};

const mockSyncService = {
  loadDataFile: jest.fn(),
  syncNow: jest.fn(),
};

// Mock the ServiceProvider context
jest.mock('../../contexts/ServiceProviders', () => ({
  useStorageFactory: () => mockStorageFactory,
  useSyncService: () => mockSyncService,
}));

describe('WelcomeDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
    mockStorageFactory.replaceProvider.mockResolvedValue(undefined);
    mockSyncService.loadDataFile.mockResolvedValue(undefined);

    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    const openFileButton = screen.getByRole('button', { name: /open existing/i });
    fireEvent.click(openFileButton);

    await waitFor(() => {
      expect(FilePickerService.showOpenFilePicker).toHaveBeenCalledTimes(1);
      expect(mockStorageFactory.replaceProvider).toHaveBeenCalledWith({
        type: StorageProviderType.LOCAL,
        fileHandle: mockFileHandle,
      });
      expect(mockSyncService.loadDataFile).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should create new file and close dialog when Create New File clicked', async () => {
    const mockFileHandle = {} as FileSystemFileHandle;
    (FilePickerService.showSaveFilePicker as jest.Mock).mockResolvedValue(mockFileHandle);
    mockStorageFactory.replaceProvider.mockResolvedValue(undefined);
    mockSyncService.syncNow.mockResolvedValue(undefined);

    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    const createFileButton = screen.getByRole('button', { name: /create new/i });
    fireEvent.click(createFileButton);

    await waitFor(() => {
      expect(FilePickerService.showSaveFilePicker).toHaveBeenCalledWith('money-tree.json');
      expect(mockStorageFactory.replaceProvider).toHaveBeenCalledWith({
        type: StorageProviderType.LOCAL,
        fileHandle: mockFileHandle,
      });
      expect(mockSyncService.syncNow).toHaveBeenCalledWith(false, true);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should show helper text about changing location later', () => {
    render(<WelcomeDialog open={true} onClose={mockOnClose} />);

    expect(
      screen.getByText(/you can change your data storage location later in settings/i)
    ).toBeInTheDocument();
  });
});
