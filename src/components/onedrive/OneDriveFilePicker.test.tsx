import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OneDriveFilePicker } from './OneDriveFilePicker';
import { OneDriveProvider } from '../../services/storage/OneDriveProvider';
import * as ServiceProviders from '../../contexts/ServiceProviders';

// Mock dependencies
jest.mock('../../contexts/ServiceProviders');

describe('OneDriveFilePicker', () => {
  const mockProvider = {
    listDriveItems: jest.fn(),
    setFile: jest.fn(),
  } as unknown as OneDriveProvider;

  const mockStorage = {
    provider: mockProvider,
  };

  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ServiceProviders.useStorage as jest.Mock).mockReturnValue(mockStorage);
  });

  const mockDriveItems = [
    {
      id: 'folder1',
      name: 'Documents',
      folder: { childCount: 0 },
      parentReference: { id: 'root', path: '/drive/root:' },
    },
    {
      id: 'file1',
      name: 'test.json',
      file: { mimeType: 'application/json' },
      parentReference: { id: 'root', path: '/drive/root:' },
    },
    {
      id: 'file2',
      name: 'shared-data.json',
      file: { mimeType: 'application/json' },
      remoteItem: { id: 'remote1' },
      parentReference: { id: 'root', path: '/drive/root:' },
    },
  ];

  it('should render and list files', async () => {
    mockProvider.listDriveItems = jest.fn().mockResolvedValue(mockDriveItems);

    render(<OneDriveFilePicker open={true} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText('Select OneDrive File Location')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('test.json')).toBeInTheDocument();
      expect(screen.getByText('shared-data.json')).toBeInTheDocument();
    });
  });

  it('should show shared icon for shared files', async () => {
    mockProvider.listDriveItems = jest.fn().mockResolvedValue(mockDriveItems);

    render(<OneDriveFilePicker open={true} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    await waitFor(() => {
      const sharedIcons = screen.getAllByTitle('Shared');
      expect(sharedIcons).toHaveLength(1);
    });
  });

  it('should handle file selection in open mode', async () => {
    const user = userEvent.setup();
    mockProvider.listDriveItems = jest.fn().mockResolvedValue(mockDriveItems);
    mockProvider.setFile = jest.fn().mockResolvedValue(undefined);

    render(
      <OneDriveFilePicker
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
      expect(mockProvider.setFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileId: 'file1',
          filePath: expect.stringContaining('test.json'),
        })
      );
      expect(mockOnComplete).toHaveBeenCalledWith(true);
    });
  });

  it('should handle new file creation in create mode', async () => {
    const user = userEvent.setup();
    const mockFolders = [
      {
        id: 'folder1',
        name: 'Documents',
        folder: { childCount: 0 },
        parentReference: { id: 'root', path: '/drive/root:' },
      },
    ];
    mockProvider.listDriveItems = jest.fn().mockResolvedValue(mockFolders);
    mockProvider.setFile = jest.fn().mockResolvedValue(undefined);

    render(
      <OneDriveFilePicker
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
      expect(mockProvider.setFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileId: null,
          filePath: 'new-file.json',
        })
      );
      expect(mockOnComplete).toHaveBeenCalledWith(false);
    });
  });

  it('should navigate into folders', async () => {
    const user = userEvent.setup();
    mockProvider.listDriveItems = jest
      .fn()
      .mockResolvedValueOnce(mockDriveItems)
      .mockResolvedValueOnce([
        {
          id: 'file3',
          name: 'document.json',
          file: { mimeType: 'application/json' },
          parentReference: { id: 'folder1', path: '/drive/root:/Documents' },
        },
      ]);

    render(<OneDriveFilePicker open={true} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    // Click folder to navigate
    await user.click(screen.getByText('Documents'));

    await waitFor(() => {
      expect(mockProvider.listDriveItems).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'folder1',
          name: 'Documents',
        })
      );
      expect(screen.getByText('document.json')).toBeInTheDocument();
    });
  });

  it('should handle cancel', async () => {
    const user = userEvent.setup();
    mockProvider.listDriveItems = jest.fn().mockResolvedValue(mockDriveItems);

    render(<OneDriveFilePicker open={true} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText('test.json')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should load both personal and shared items at root level', async () => {
    // Mock both personal items and shared items at root
    const mockRootItems = [
      {
        id: 'folder1',
        name: 'Documents',
        folder: { childCount: 0 },
        parentReference: { id: 'root', path: '/drive/root:' },
      },
      {
        id: 'file1',
        name: 'personal.json',
        file: { mimeType: 'application/json' },
        parentReference: { id: 'root', path: '/drive/root:' },
      },
      {
        id: 'shared-folder',
        name: 'Shared Workspace',
        folder: { childCount: 2 },
        remoteItem: {
          id: 'remote-shared',
          parentReference: { driveId: 'shared-drive-456' },
        },
        parentReference: { id: 'root', path: '/drive/root:' },
      },
      {
        id: 'shared-file',
        name: 'team-data.json',
        file: { mimeType: 'application/json' },
        remoteItem: { id: 'remote-file' },
        parentReference: { id: 'root', path: '/drive/root:' },
      },
    ];

    mockProvider.listDriveItems = jest.fn().mockResolvedValue(mockRootItems);

    render(<OneDriveFilePicker open={true} onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    await waitFor(() => {
      // Verify all items are shown: personal folder, personal file, shared folder, shared file
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('personal.json')).toBeInTheDocument();
      expect(screen.getByText('Shared Workspace')).toBeInTheDocument();
      expect(screen.getByText('team-data.json')).toBeInTheDocument();

      // Verify shared items show the shared icon
      const sharedIcons = screen.getAllByTitle('Shared');
      expect(sharedIcons).toHaveLength(2); // Shared folder and shared file
    });
  });

  it('should use custom default file name', async () => {
    mockProvider.listDriveItems = jest.fn().mockResolvedValue([]);

    render(
      <OneDriveFilePicker
        open={true}
        mode="create"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        defaultFileName="custom-file.json"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select OneDrive File Location')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: 'Create Here' });
    await userEvent.click(createButton);

    await waitFor(() => {
      const input = screen.getByDisplayValue('custom-file.json');
      expect(input).toBeInTheDocument();
    });
  });

  it('should handle shared folder context when creating files', async () => {
    const user = userEvent.setup();
    const mockSharedFolders = [
      {
        id: 'folder1',
        name: 'SharedFolder',
        folder: { childCount: 0 },
        remoteItem: {
          id: 'remote-folder1',
          parentReference: { driveId: 'shared-drive-123' },
        },
        parentReference: { id: 'root', path: '/drive/root:' },
      },
    ];
    mockProvider.listDriveItems = jest.fn().mockResolvedValue(mockSharedFolders);
    mockProvider.setFile = jest.fn().mockResolvedValue(undefined);

    render(
      <OneDriveFilePicker
        open={true}
        mode="create"
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('SharedFolder')).toBeInTheDocument();
    });

    // Navigate into shared folder
    await user.click(screen.getByText('SharedFolder'));

    // Create file here
    await waitFor(() => {
      expect(mockProvider.listDriveItems).toHaveBeenCalled();
    });

    const createButton = screen.getByRole('button', { name: 'Create Here' });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockProvider.setFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileId: null,
          driveId: 'shared-drive-123',
        })
      );
    });
  });
});
