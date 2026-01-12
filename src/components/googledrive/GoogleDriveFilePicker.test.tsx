import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleDriveFilePicker } from './GoogleDriveFilePicker';
import type { DriveFile } from '../../services/storage/GoogleDriveService';

describe('GoogleDriveFilePicker', () => {
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnListFiles = jest.fn();

  const mockFiles: DriveFile[] = [
    {
      id: 'folder-1',
      name: 'Documents',
      mimeType: 'application/vnd.google-apps.folder',
    },
    {
      id: 'file-1',
      name: 'test.json',
      mimeType: 'application/json',
    },
    {
      id: 'file-2',
      name: 'data.json',
      mimeType: 'application/json',
      parents: ['folder-1'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnListFiles.mockResolvedValue(mockFiles);
  });

  it('should render dialog when open', () => {
    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    expect(screen.getByText('Select Google Drive File Location')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(
      <GoogleDriveFilePicker
        open={false}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    expect(screen.queryByText('Select Google Drive File Location')).not.toBeInTheDocument();
  });

  it('should load files on open', async () => {
    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    await waitFor(() => {
      expect(mockOnListFiles).toHaveBeenCalled();
    });
  });

  it('should display folders and files', async () => {
    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('test.json')).toBeInTheDocument();
    });
  });

  it('should handle folder navigation', async () => {
    const user = userEvent.setup();
    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Documents'));

    await waitFor(() => {
      expect(mockOnListFiles).toHaveBeenCalledWith('folder-1');
    });
  });

  it('should handle file selection', async () => {
    const user = userEvent.setup();
    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.json')).toBeInTheDocument();
    });

    await user.click(screen.getByText('test.json'));

    const selectButton = screen.getByRole('button', { name: /select file/i });
    expect(selectButton).not.toBeDisabled();

    await user.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith({
      fileId: 'file-1',
      fileName: 'test.json',
      parentId: undefined,
    });
  });

  it('should handle cancel action', async () => {
    const user = userEvent.setup();
    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should open file name dialog on Create File', async () => {
    const user = userEvent.setup();
    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create file/i })).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create file/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
    });
  });

  it('should validate file name has .json extension', async () => {
    const user = userEvent.setup();
    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create file/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create file/i }));

    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
    });

    const fileNameInput = screen.getByLabelText(/file name/i);
    await user.clear(fileNameInput);
    await user.type(fileNameInput, 'invalid-name');

    // Get all buttons, find the one in the inner dialog that says just "Create"
    const allButtons = screen.getAllByRole('button');
    const createButtonInDialog = allButtons.find((btn) => btn.textContent === 'Create');
    expect(createButtonInDialog).toBeDefined();
    expect(createButtonInDialog).toBeDisabled();
  });

  it('should handle error when loading files', async () => {
    mockOnListFiles.mockRejectedValueOnce(new Error('Failed to load'));

    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('should show shared indicator for shared files and folders', async () => {
    const sharedFiles: DriveFile[] = [
      {
        id: 'shared-folder',
        name: 'Shared Folder',
        mimeType: 'application/vnd.google-apps.folder',
        shared: true,
      },
      {
        id: 'shared-file',
        name: 'shared.json',
        mimeType: 'application/json',
        shared: true,
      },
      {
        id: 'private-file',
        name: 'private.json',
        mimeType: 'application/json',
        shared: false,
      },
    ];

    mockOnListFiles.mockResolvedValue(sharedFiles);

    render(
      <GoogleDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFiles={mockOnListFiles}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Shared Folder')).toBeInTheDocument();
    });

    // Should show 2 shared icons (for shared folder and shared file)
    const sharedIcons = screen.getAllByTitle('Shared');
    expect(sharedIcons).toHaveLength(2);
  });
});
