import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataSyncSettings } from './DataSyncSettings';
import { AppProvider } from '../../contexts/AppContext';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useCategories } from '../../hooks/queries/useCategories';
import { useTransactionTypes } from '../../hooks/queries/useTransactionTypes';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useAssets } from '../../hooks/queries/useAssets';
import { useBudgets } from '../../hooks/queries/useBudgets';

// Mock data hooks
jest.mock('../../hooks/queries/useAccounts');
jest.mock('../../hooks/queries/useCategories');
jest.mock('../../hooks/queries/useTransactionTypes');
jest.mock('../../hooks/queries/useTransactions');
jest.mock('../../hooks/queries/useAssets');
jest.mock('../../hooks/queries/useBudgets');

const mockUseAccounts = useAccounts as jest.MockedFunction<typeof useAccounts>;
const mockUseCategories = useCategories as jest.MockedFunction<typeof useCategories>;
const mockUseTransactionTypes = useTransactionTypes as jest.MockedFunction<
  typeof useTransactionTypes
>;
const mockUseTransactions = useTransactions as jest.MockedFunction<typeof useTransactions>;
const mockUseAssets = useAssets as jest.MockedFunction<typeof useAssets>;
const mockUseBudgets = useBudgets as jest.MockedFunction<typeof useBudgets>;

// Mock CloudSyncService class
jest.mock('../../services/cloudSync.service', () => ({
  CloudSyncService: jest.fn().mockImplementation(() => ({
    uploadToCloud: jest.fn().mockResolvedValue(undefined),
    downloadFromCloud: jest.fn().mockResolvedValue(undefined),
    fullSync: jest.fn().mockResolvedValue(undefined),
    debouncedSync: jest.fn(),
    setCallbacks: jest.fn(),
    syncing: false,
    pendingChanges: false,
  })),
}));

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

    // Setup default mock return values
    mockUseAccounts.mockReturnValue([]);
    mockUseCategories.mockReturnValue([]);
    mockUseTransactionTypes.mockReturnValue([]);
    mockUseTransactions.mockReturnValue([]);
    mockUseAssets.mockReturnValue([]);
    mockUseBudgets.mockReturnValue([]);
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
