import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataSyncSettings } from './DataSyncSettings';
import { AppProvider } from '../../contexts/AppContext';

// Mock SyncProvider
jest.mock('../../contexts/SyncProvider', () => ({
  useSyncService: jest.fn(() => ({
    isConnected: false,
    providerName: null,
    fileName: null,
    providerType: null,
    isSyncing: false,
    lastSynced: null,
    pendingChanges: false,
    provider: null,
    uploadToCloud: jest.fn().mockResolvedValue(undefined),
    downloadFromCloud: jest.fn().mockResolvedValue(undefined),
    fullSync: jest.fn().mockResolvedValue(undefined),
    debouncedSync: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
  SyncProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock storage services
const mockStorageFactory = {
  getCurrentProvider: jest.fn(() => ({
    getName: () => 'OneDrive',
  })),
  getCurrentFileName: jest.fn(() => 'test-file.json'),
  disconnect: jest.fn(),
};

// Mock the hooks
jest.mock('../../hooks/queries', () => ({
  ...jest.requireActual('../../hooks/queries'),
  useLastSynced: jest.fn(() => null),
}));

jest.mock('../../contexts/ServiceProviders', () => ({
  useStorageFactory: () => mockStorageFactory,
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
  });

  const renderComponent = () => {
    return render(
      <AppProvider>
        <BrowserRouter>
          <DataSyncSettings />
        </BrowserRouter>
      </AppProvider>
    );
  };

  describe('Current File Information', () => {
    it('should display file information when not connected', () => {
      renderComponent();

      expect(screen.getByText('Current File')).toBeInTheDocument();
      expect(screen.getByText('No file loaded')).toBeInTheDocument();
      const notConnectedElements = screen.getAllByText('Not connected');
      expect(notConnectedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Disconnect', () => {
    it('should render disconnect section', () => {
      renderComponent();

      expect(screen.getByText('Connection')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    it('should have disconnect button disabled when not connected', () => {
      renderComponent();

      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      expect(disconnectButton).toBeDisabled();
    });
  });
});
