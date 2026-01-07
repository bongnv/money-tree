import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OneDriveFilePicker, DriveItem } from './OneDriveFilePicker';

describe('OneDriveFilePicker', () => {
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnListFolders = jest.fn();

  const mockRootItems: DriveItem[] = [
    {
      id: 'folder1',
      name: 'Documents',
      folder: { childCount: 5 },
    },
    {
      id: 'folder2',
      name: 'Pictures',
      folder: { childCount: 10 },
    },
    {
      id: 'file1',
      name: 'money-tree.json',
      file: { mimeType: 'application/json' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnListFolders.mockResolvedValue(mockRootItems);
  });

  it('should render file picker dialog when open', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select OneDrive File Location')).toBeInTheDocument();
    });
  });

  it('should load root folders on open', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(mockOnListFolders).toHaveBeenCalledWith(undefined);
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Pictures')).toBeInTheDocument();
    });
  });

  it('should show both action buttons', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create File')).toBeInTheDocument();
      expect(screen.getByText('Select File')).toBeInTheDocument();
    });
  });

  it('should show Create File dialog when Create File clicked', async () => {
    const user = userEvent.setup();

    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create File')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create file/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
      expect(screen.getByLabelText('File name')).toBeInTheDocument();
    });
  });

  it('should show json files in the list', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('money-tree.json')).toBeInTheDocument();
    });
  });

  it('should navigate into folder', async () => {
    mockOnListFolders.mockResolvedValueOnce(mockRootItems);

    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    const documentsFolder = screen.getAllByText('Documents')[0]; // Get first occurrence (list item, not breadcrumb)
    fireEvent.click(documentsFolder);

    await waitFor(() => {
      expect(mockOnListFolders).toHaveBeenCalledWith({
        id: 'folder1',
        name: 'Documents',
        folder: { childCount: 5 },
      });
    });
  });

  it('should call onSelect with new file info', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
        defaultFileName="test.json"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('OneDrive')).toBeInTheDocument();
    });

    // Click Create File button to open dialog
    const createButton = screen.getByText('Create File');
    fireEvent.click(createButton);

    // Wait for dialog and submit
    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(submitButton);

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: null,
        filePath: 'test.json',
      })
    );
  });

  it('should call onSelect with existing file info', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('money-tree.json')).toBeInTheDocument();
    });

    const jsonFile = screen.getByText('money-tree.json');
    fireEvent.click(jsonFile);

    const selectButton = screen.getByText('Select File');
    fireEvent.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'file1',
        filePath: expect.stringContaining('money-tree.json'),
      })
    );
  });

  it('should call onCancel when cancel button clicked', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable select button when no file selected', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select File')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('Select File') as HTMLButtonElement;
    expect(selectButton.disabled).toBe(true);
  });

  it('should show error when folder loading fails', async () => {
    const errorMessage = 'Failed to load folder contents';
    mockOnListFolders.mockRejectedValue(new Error(errorMessage));

    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should validate json extension for new files', async () => {
    const user = userEvent.setup();

    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create File')).toBeInTheDocument();
    });

    // Click Create File button to open dialog
    const createFileButton = screen.getByRole('button', { name: /create file/i });
    await user.click(createFileButton);

    // Wait for Create New File dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
    });

    const fileNameInput = screen.getByLabelText('File name') as HTMLInputElement;
    await user.clear(fileNameInput);
    await user.type(fileNameInput, 'invalid.txt');

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement;
      expect(createButton.disabled).toBe(true);
    });
  });
});
