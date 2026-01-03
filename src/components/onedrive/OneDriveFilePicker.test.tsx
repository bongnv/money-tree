import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('should show new file mode by default', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      const newFileRadio = screen.getByLabelText('Create new file') as HTMLInputElement;
      expect(newFileRadio.checked).toBe(true);
    });
  });

  it('should show file name input in new file mode', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('File name')).toBeInTheDocument();
    });
  });

  it('should switch to existing file mode', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      const existingFileRadio = screen.getByLabelText('Select existing file');
      fireEvent.click(existingFileRadio);
    });

    const existingFileRadio = screen.getByLabelText('Select existing file') as HTMLInputElement;
    expect(existingFileRadio.checked).toBe(true);
  });

  it('should show json files in existing file mode', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      const existingFileRadio = screen.getByLabelText('Select existing file');
      fireEvent.click(existingFileRadio);
    });

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

    const createButton = screen.getByText('Create Here');
    fireEvent.click(createButton);

    expect(mockOnSelect).toHaveBeenCalledWith({
      fileId: 'new',
      filePath: 'OneDrive/test.json',
      fileName: 'test.json',
      isNew: true,
    });
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
      const existingFileRadio = screen.getByLabelText('Select existing file');
      fireEvent.click(existingFileRadio);
    });

    await waitFor(() => {
      const jsonFile = screen.getByText('money-tree.json');
      fireEvent.click(jsonFile);
    });

    const selectButton = screen.getByText('Select File');
    fireEvent.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'file1',
        fileName: 'money-tree.json',
        isNew: false,
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

  it('should disable select button when no file selected in existing mode', async () => {
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      const existingFileRadio = screen.getByLabelText('Select existing file');
      fireEvent.click(existingFileRadio);
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
    render(
      <OneDriveFilePicker
        open={true}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        onListFolders={mockOnListFolders}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('File name')).toBeInTheDocument();
    });

    const fileNameInput = screen.getByLabelText('File name') as HTMLInputElement;
    fireEvent.change(fileNameInput, { target: { value: 'invalid.txt' } });

    const createButton = screen.getByText('Create Here') as HTMLButtonElement;
    expect(createButton.disabled).toBe(true);
  });
});
