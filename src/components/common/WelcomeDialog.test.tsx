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

// Create mock instance
const mockStorageFactory = {
  replaceProvider: jest.fn(),
  authenticateOneDrive: jest.fn(),
  authenticateGoogleDrive: jest.fn(),
  showGoogleDriveFilePicker: jest.fn(),
  listOneDriveFolders: jest.fn(),
};

// Mock the ServiceProvider context
jest.mock('../../contexts/ServiceProviders', () => ({
  useStorageFactory: () => mockStorageFactory,
}));

describe('WelcomeDialog', () => {
  const mockOnNewFileCreated = jest.fn();
  const mockOnExistingFileSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <WelcomeDialog
        open={true}
        onNewFileCreated={mockOnNewFileCreated}
        onExistingFileSelected={mockOnExistingFileSelected}
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
        onNewFileCreated={mockOnNewFileCreated}
        onExistingFileSelected={mockOnExistingFileSelected}
      />
    );

    expect(screen.queryByText('Welcome to Money Tree')).not.toBeInTheDocument();
  });

  it('should call onExistingFileSelected when Open Existing File button clicked', async () => {
    const mockFileHandle = {} as FileSystemFileHandle;
    (FilePickerService.showOpenFilePicker as jest.Mock).mockResolvedValue(mockFileHandle);
    mockStorageFactory.replaceProvider.mockResolvedValue(undefined);

    render(
      <WelcomeDialog
        open={true}
        onNewFileCreated={mockOnNewFileCreated}
        onExistingFileSelected={mockOnExistingFileSelected}
      />
    );

    const openFileButton = screen.getByRole('button', { name: /open existing/i });
    fireEvent.click(openFileButton);

    await waitFor(() => {
      expect(FilePickerService.showOpenFilePicker).toHaveBeenCalledTimes(1);
      expect(mockStorageFactory.replaceProvider).toHaveBeenCalledWith({
        type: StorageProviderType.LOCAL,
        fileHandle: mockFileHandle,
      });
      expect(mockOnExistingFileSelected).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onNewFileCreated when Create New File clicked', async () => {
    const mockFileHandle = {} as FileSystemFileHandle;
    (FilePickerService.showSaveFilePicker as jest.Mock).mockResolvedValue(mockFileHandle);
    mockStorageFactory.replaceProvider.mockResolvedValue(undefined);

    render(
      <WelcomeDialog
        open={true}
        onNewFileCreated={mockOnNewFileCreated}
        onExistingFileSelected={mockOnExistingFileSelected}
      />
    );

    const createFileButton = screen.getByRole('button', { name: /create new/i });
    fireEvent.click(createFileButton);

    await waitFor(() => {
      expect(FilePickerService.showSaveFilePicker).toHaveBeenCalledWith('money-tree.json');
      expect(mockStorageFactory.replaceProvider).toHaveBeenCalledWith({
        type: StorageProviderType.LOCAL,
        fileHandle: mockFileHandle,
      });
      expect(mockOnNewFileCreated).toHaveBeenCalledTimes(1);
    });
  });

  it('should show helper text about changing location later', () => {
    render(
      <WelcomeDialog
        open={true}
        onNewFileCreated={mockOnNewFileCreated}
        onExistingFileSelected={mockOnExistingFileSelected}
      />
    );

    expect(
      screen.getByText(/you can change your data storage location later in settings/i)
    ).toBeInTheDocument();
  });
});
