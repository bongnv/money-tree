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
        mode="open"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Select File')).toBeInTheDocument();
    });
  });

  it('should show Create Here button in create mode', async () => {
    const user = userEvent.setup();

    render(
      <OneDriveFilePicker
        open={true}
        mode="create"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    // Select a folder
    await user.click(screen.getByText('Documents'));

    // Should show Create Here button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create here/i })).toBeInTheDocument();
    });

    // Click Create Here button
    const createButton = screen.getByRole('button', { name: /create here/i });
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
    const user = userEvent.setup();

    render(
      <OneDriveFilePicker
        open={true}
        mode="create"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
        defaultFileName="test.json"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    // Navigate into folder
    await user.click(screen.getByText('Documents'));

    await waitFor(() => {
      // Verify we navigated into the folder
      expect(mockOnListFolders).toHaveBeenCalledTimes(2); // Once for root, once for Documents
    });

    // Click Create Here button to open dialog (creates in current folder)
    const createButton = screen.getByRole('button', { name: /create here/i });
    await user.click(createButton);

    // Wait for dialog and submit
    await waitFor(() => {
      expect(screen.getByText('Create New File')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: 'Create' });
    await user.click(submitButton);

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: null,
        filePath: 'Documents/test.json', // File created in Documents folder
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
        mode="create"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    // Select a folder
    await user.click(screen.getByText('Documents'));

    // Click Create Here button to open dialog
    const createButton = screen.getByRole('button', { name: /create here/i });
    await user.click(createButton);

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

  it('should filter out non-JSON files from the list', async () => {
    const itemsWithNonJson: DriveItem[] = [
      {
        id: 'folder1',
        name: 'Documents',
        folder: { childCount: 5 },
      },
      {
        id: 'file1',
        name: 'budget.json',
        file: { mimeType: 'application/json' },
      },
      {
        id: 'file2',
        name: 'notes.txt',
        file: { mimeType: 'text/plain' },
      },
      {
        id: 'file3',
        name: 'report.pdf',
        file: { mimeType: 'application/pdf' },
      },
      {
        id: 'file4',
        name: 'data.json',
        file: { mimeType: 'application/json' },
      },
    ];

    mockOnListFolders.mockResolvedValue(itemsWithNonJson);

    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      // Should show folders
      expect(screen.getByText('Documents')).toBeInTheDocument();
      // Should show .json files
      expect(screen.getByText('budget.json')).toBeInTheDocument();
      expect(screen.getByText('data.json')).toBeInTheDocument();
      // Should NOT show non-JSON files
      expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
      expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
    });
  });
});
