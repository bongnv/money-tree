import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataSyncSettings } from './DataSyncSettings';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';

// Mock the sync service
jest.mock('../../services/sync.service', () => ({
  syncService: {
    resetToWelcome: jest.fn(),
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

  describe('Current File Information', () => {
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

      // Should display "Never" for Last Modified (use getAllByText since Last Backup also shows "Never")
      const neverTexts = screen.getAllByText('Never');
      expect(neverTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Disconnect', () => {
    it('should render disconnect section', () => {
      renderComponent();

      expect(screen.getByText('Connection')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    it('should show confirmation dialog when disconnect button is clicked', () => {
      renderComponent();

      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      fireEvent.click(disconnectButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Disconnect from Current File/i)).toBeInTheDocument();
    });

    it('should call resetToWelcome and navigate after confirming', async () => {
      renderComponent();

      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      fireEvent.click(disconnectButton);

      const confirmButton = screen.getByRole('button', { name: 'Disconnect' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(syncService.resetToWelcome).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should disable disconnect button when no file is loaded', () => {
      useAppStore.setState({ fileName: null });
      renderComponent();

      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      expect(disconnectButton).toBeDisabled();
    });
  });
});
