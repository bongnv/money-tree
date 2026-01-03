import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataSyncSettings } from './DataSyncSettings';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';

// Mock the sync service
jest.mock('../../services/sync.service', () => ({
  syncService: {
    switchFile: jest.fn(),
    clearCachedFile: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DataSyncSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.setState({
      fileName: 'test-file.json',
      lastSaved: new Date('2024-01-01T12:00:00Z').toISOString(),
      hasUnsavedChanges: false,
      currentYear: 2024,
      isLoading: false,
      error: null,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <DataSyncSettings />
      </BrowserRouter>
    );
  };

  describe('Section 1: Current File', () => {
    it('should display file information', () => {
      renderComponent();

      expect(screen.getByText('Current File')).toBeInTheDocument();
      expect(screen.getByText('test-file.json')).toBeInTheDocument();
      expect(screen.getByText('All changes saved')).toBeInTheDocument();
    });

    it('should display "No file loaded" when no file is loaded', () => {
      useAppStore.setState({ fileName: null });
      renderComponent();

      expect(screen.getByText('No file loaded')).toBeInTheDocument();
    });

    it('should display "Unsaved changes" status when there are unsaved changes', () => {
      useAppStore.setState({ hasUnsavedChanges: true });
      renderComponent();

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('should display last modified time', () => {
      renderComponent();

      // Should display relative time
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    it('should display "Never" when no last saved time', () => {
      useAppStore.setState({ lastSaved: null });
      renderComponent();

      expect(screen.getByText('Never')).toBeInTheDocument();
    });
  });

  describe('Section 2: File Management', () => {
    it('should render file management section', () => {
      renderComponent();

      expect(screen.getByText('File Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear cached file/i })).toBeInTheDocument();
    });

    it('should call switchFile when Switch File button is clicked without unsaved changes', async () => {
      renderComponent();

      const switchButton = screen.getByRole('button', { name: /switch file/i });
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(syncService.switchFile).toHaveBeenCalledWith(2024);
      });
    });

    it('should show confirmation dialog when switching file with unsaved changes', async () => {
      useAppStore.setState({ hasUnsavedChanges: true });
      renderComponent();

      const switchButton = screen.getByRole('button', { name: /switch file/i });
      fireEvent.click(switchButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getAllByText(/unsaved changes/i).length).toBeGreaterThan(0);
    });

    it('should call switchFile after confirming dialog', async () => {
      useAppStore.setState({ hasUnsavedChanges: true });
      renderComponent();

      const switchButton = screen.getByRole('button', { name: /switch file/i });
      fireEvent.click(switchButton);

      // Find the confirm button in the dialog
      const confirmButton = screen.getByRole('button', { name: 'Switch File' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(syncService.switchFile).toHaveBeenCalledWith(2024);
      });
    });

    it('should show confirmation dialog when clearing cached file', () => {
      renderComponent();

      const clearButton = screen.getByRole('button', { name: /clear cached file/i });
      fireEvent.click(clearButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/remove the cached file reference/i)).toBeInTheDocument();
    });

    it('should call clearCachedFile, clear localStorage, and navigate after confirming', async () => {
      // Mock localStorage
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      renderComponent();

      const clearButton = screen.getByRole('button', { name: /clear cached file/i });
      fireEvent.click(clearButton);

      const confirmButton = screen.getByRole('button', { name: /clear cache/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(syncService.clearCachedFile).toHaveBeenCalled();
        expect(removeItemSpy).toHaveBeenCalledWith('moneyTree.welcomeDismissed');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });

      removeItemSpy.mockRestore();
    });

    it('should disable Clear Cached File button when no file is loaded', () => {
      useAppStore.setState({ fileName: null });
      renderComponent();

      const clearButton = screen.getByRole('button', { name: /clear cached file/i });
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Section 3: Storage Provider', () => {
    it('should render storage provider section', () => {
      renderComponent();

      expect(screen.getByText('Storage Provider')).toBeInTheDocument();
      expect(screen.getByText(/choose where your data is stored/i)).toBeInTheDocument();
    });

    it('should display Local File System as selected', () => {
      renderComponent();

      expect(screen.getByText('Local File System')).toBeInTheDocument();
    });

    it('should have provider select field disabled', () => {
      renderComponent();

      const selectContainer = screen.getByRole('combobox').parentElement;
      expect(selectContainer).toHaveClass('Mui-disabled');
    });
  });

  describe('Error handling', () => {
    it('should handle switchFile errors gracefully', async () => {
      (syncService.switchFile as jest.Mock).mockRejectedValue(new Error('Switch failed'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      renderComponent();

      const switchButton = screen.getByRole('button', { name: /switch file/i });
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to switch file:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle clearCachedFile errors gracefully', async () => {
      (syncService.clearCachedFile as jest.Mock).mockRejectedValue(new Error('Clear failed'));
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      renderComponent();

      const clearButton = screen.getByRole('button', { name: /clear cached file/i });
      fireEvent.click(clearButton);

      const confirmButton = screen.getByRole('button', { name: /clear cache/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to clear cached file:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });
});
