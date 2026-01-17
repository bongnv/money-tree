import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleDriveFilePicker } from './GoogleDriveFilePicker';
import { GoogleDriveProvider } from '../../services/storage/GoogleDriveProvider';
import { driveApiConfig } from '../../config/googledrive.config';
import * as ServiceProviders from '../../contexts/ServiceProviders';

// Mock dependencies
jest.mock('../../contexts/ServiceProviders');

describe('GoogleDriveFilePicker', () => {
  const mockProvider = {
    listDriveFiles: jest.fn(),
    setFile: jest.fn(),
  } as unknown as GoogleDriveProvider;

  const mockStorage = {
    provider: mockProvider,
  };

  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ServiceProviders.useStorage as jest.Mock).mockReturnValue(mockStorage);
  });

  const mockDriveFiles = [
    {
      id: 'folder1',
      name: 'Documents',
      mimeType: driveApiConfig.folderMimeType,
      shared: false,
    },
    {
      id: 'file1',
      name: 'test.json',
      mimeType: 'application/json',
      shared: false,
    },
    {
      id: 'file2',
      name: 'shared-data.json',
      mimeType: 'application/json',
      shared: true,
    },
  ];

  it('should render and list files', async () => {
    mockProvider.listDriveFiles = jest.fn().mockResolvedValue(mockDriveFiles);

    render(
      <GoogleDriveFilePicker
        open={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select Google Drive File Location')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('test.json')).toBeInTheDocument();
      expect(screen.getByText('shared-data.json')).toBeInTheDocument();
    });
  });

  it('should show shared icon for shared files', async () => {
    mockProvider.listDriveFiles = jest.fn().mockResolvedValue(mockDriveFiles);

    render(
      <GoogleDriveFilePicker
        open={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      const sharedIcons = screen.getAllByTitle('Shared');
      expect(sharedIcons).toHaveLength(1);
    });
  });

  it('should handle file selection in open mode', async () => {
    const user = userEvent.setup();
    mockProvider.listDriveFiles = jest.fn().mockResolvedValue(mockDriveFiles);
    mockProvider.setFile = jest.fn().mockResolvedValue(undefined);

    render(
      <GoogleDriveFilePicker
        open={true}
        mode="open"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.json')).toBeInTheDocument();
    });

    // Click file to select it
    await user.click(screen.getByText('test.json'));

    // Click Select File button
    const selectButton = screen.getByRole('button', { name: 'Select File' });
    await user.click(selectButton);

    await waitFor(() => {
      expect(mockProvider.setFile).toHaveBeenCalledWith({
        fileId: 'file1',
        fileName: 'test.json',
        parentId: undefined,
      });
      expect(mockOnComplete).toHaveBeenCalledWith(true);
    });
  });

  it('should handle new file creation in create mode', async () => {
    const user = userEvent.setup();
    const mockFolders = [
      {
        id: 'folder1',
        name: 'Documents',
        mimeType: driveApiConfig.folderMimeType,
        shared: false,
      },
    ];
    mockProvider.listDriveFiles = jest.fn().mockResolvedValue(mockFolders);
    mockProvider.setFile = jest.fn().mockResolvedValue(undefined);

    render(
      <GoogleDriveFilePicker
        open={true}
        mode="create"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        defaultFileName="new-file.json"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    // Click "Create Here" button
    await user.click(screen.getByRole('button', { name: 'Create Here' }));

    // Wait for dialog and create
    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockProvider.setFile).toHaveBeenCalledWith({
        fileId: null,
        fileName: 'new-file.json',
        parentId: undefined,
      });
      expect(mockOnComplete).toHaveBeenCalledWith(false);
    });
  });

  it('should navigate into folders', async () => {
    const user = userEvent.setup();
    mockProvider.listDriveFiles = jest
      .fn()
      .mockResolvedValueOnce(mockDriveFiles)
      .mockResolvedValueOnce([
        {
          id: 'file3',
          name: 'document.json',
          mimeType: 'application/json',
          shared: false,
        },
      ]);

    render(
      <GoogleDriveFilePicker
        open={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    // Click folder to navigate
    await user.click(screen.getByText('Documents'));

    await waitFor(() => {
      expect(mockProvider.listDriveFiles).toHaveBeenCalledWith('folder1');
      expect(screen.getByText('document.json')).toBeInTheDocument();
    });
  });

  it('should handle cancel', async () => {
    const user = userEvent.setup();
    mockProvider.listDriveFiles = jest.fn().mockResolvedValue(mockDriveFiles);

    render(
      <GoogleDriveFilePicker
        open={true}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.json')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should use custom default file name', async () => {
    mockProvider.listDriveFiles = jest.fn().mockResolvedValue([]);

    render(
      <GoogleDriveFilePicker
        open={true}
        mode="create"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        defaultFileName="custom-file.json"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select Google Drive File Location')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: 'Create Here' });
    await userEvent.click(createButton);

    await waitFor(() => {
      const input = screen.getByDisplayValue('custom-file.json');
      expect(input).toBeInTheDocument();
    });
  });
});
