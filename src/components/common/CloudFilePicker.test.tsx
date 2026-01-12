import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloudFilePicker, CloudItem, CloudFileInfo } from './CloudFilePicker';

interface TestFileInfo extends CloudFileInfo {
  fileId: string | null;
  fileName: string;
  parentId?: string;
}

describe('CloudFilePicker', () => {
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnListItems = jest.fn();
  const mockMapToFileInfo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFolderItems: CloudItem[] = [
    { id: 'folder1', name: 'Documents', isFolder: true },
    { id: 'folder2', name: 'Pictures', isFolder: true },
    { id: 'file1', name: 'test.json', isFolder: false },
    { id: 'file2', name: 'data.json', isFolder: false },
  ];

  it('should render with custom title and root name', async () => {
    mockOnListItems.mockResolvedValue([]);

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Cloud Storage"
        rootName="Test Drive"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
      />
    );

    expect(screen.getByText('Test Cloud Storage')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Drive')).toBeInTheDocument();
    });
  });

  it('should load root items on open', async () => {
    mockOnListItems.mockResolvedValue(mockFolderItems);

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
      />
    );

    await waitFor(() => {
      expect(mockOnListItems).toHaveBeenCalledWith(null);
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Pictures')).toBeInTheDocument();
      expect(screen.getByText('test.json')).toBeInTheDocument();
      expect(screen.getByText('data.json')).toBeInTheDocument();
    });
  });

  it('should navigate into folders', async () => {
    const user = userEvent.setup();
    mockOnListItems
      .mockResolvedValueOnce(mockFolderItems)
      .mockResolvedValueOnce([{ id: 'file3', name: 'document.json', isFolder: false }]);

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    const documentsFolder = screen.getByText('Documents');
    await user.click(documentsFolder);

    await waitFor(() => {
      expect(mockOnListItems).toHaveBeenCalledWith('folder1');
      expect(screen.getByText('document.json')).toBeInTheDocument();
    });
  });

  it('should navigate breadcrumbs', async () => {
    const user = userEvent.setup();
    mockOnListItems
      .mockResolvedValueOnce(mockFolderItems)
      .mockResolvedValueOnce([{ id: 'file3', name: 'document.json', isFolder: false }])
      .mockResolvedValueOnce(mockFolderItems);

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        rootName="Root"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    // Navigate into folder
    await user.click(screen.getByText('Documents'));

    await waitFor(() => {
      expect(screen.getByText('document.json')).toBeInTheDocument();
    });

    // Click breadcrumb to go back
    const rootBreadcrumb = screen.getByRole('button', { name: 'Root' });
    await user.click(rootBreadcrumb);

    await waitFor(() => {
      expect(mockOnListItems).toHaveBeenCalledTimes(3);
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Pictures')).toBeInTheDocument();
    });
  });

  it('should select existing file', async () => {
    const user = userEvent.setup();
    mockOnListItems.mockResolvedValue(mockFolderItems);
    mockMapToFileInfo.mockReturnValue({
      fileId: 'file1',
      fileName: 'test.json',
      parentId: undefined,
    });

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
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
      expect(mockMapToFileInfo).toHaveBeenCalledWith('file1', 'test.json', null, expect.any(Array));
      expect(mockOnSelect).toHaveBeenCalledWith({
        fileId: 'file1',
        fileName: 'test.json',
        parentId: undefined,
      });
    });
  });

  it('should create new file', async () => {
    const user = userEvent.setup();
    mockOnListItems.mockResolvedValue([]);
    mockMapToFileInfo.mockReturnValue({
      fileId: null,
      fileName: 'new-file.json',
      parentId: undefined,
    });

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
        defaultFileName="new-file.json"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('My Drive')).toBeInTheDocument();
    });

    // Click Create File button
    await user.click(screen.getByRole('button', { name: 'Create File' }));

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
    });

    // Click Create button
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockMapToFileInfo).toHaveBeenCalledWith(
        null,
        'new-file.json',
        null,
        expect.any(Array)
      );
      expect(mockOnSelect).toHaveBeenCalledWith({
        fileId: null,
        fileName: 'new-file.json',
        parentId: undefined,
      });
    });
  });

  it('should validate file name has .json extension', async () => {
    const user = userEvent.setup();
    mockOnListItems.mockResolvedValue([]);

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('My Drive')).toBeInTheDocument();
    });

    // Click Create File button
    await user.click(screen.getByRole('button', { name: 'Create File' }));

    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
    });

    // Change file name to invalid name
    const input = screen.getByLabelText('File name');
    await user.clear(input);
    await user.type(input, 'invalid.txt');

    // Create button should be disabled
    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).toBeDisabled();
  });

  it('should call onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    mockOnListItems.mockResolvedValue([]);

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('My Drive')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should display error message on load failure', async () => {
    mockOnListItems.mockRejectedValue(new Error('Network error'));

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should render additional info for items', async () => {
    mockOnListItems.mockResolvedValue([
      {
        id: 'folder1',
        name: 'Shared Folder',
        isFolder: true,
        additionalInfo: <span data-testid="shared-icon">🔗</span>,
      },
    ]);

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Shared Folder')).toBeInTheDocument();
      expect(screen.getByTestId('shared-icon')).toBeInTheDocument();
    });
  });

  it('should show empty state when folder has no items', async () => {
    mockOnListItems.mockResolvedValue([]);

    render(
      <CloudFilePicker<TestFileInfo>
        open={true}
        title="Test Storage"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListItems={mockOnListItems}
        mapToFileInfo={mockMapToFileInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('This folder is empty')).toBeInTheDocument();
    });
  });
});
