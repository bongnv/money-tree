import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PreferencesPage } from './PreferencesPage';
import { AppProvider } from '../../contexts/AppContext';
import { CurrencyCode } from '../../types/enums';

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
    initialize: jest.fn().mockResolvedValue(undefined),
    saveDataFile: jest.fn().mockResolvedValue(undefined),
    loadDataFile: jest.fn().mockResolvedValue(undefined),
  })),
  SyncProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockStorageFactory = {
  getCurrentProvider: jest.fn(() => ({
    getName: () => 'OneDrive',
  })),
  getCurrentFileName: jest.fn(() => 'test.json'),
};

const mockBackupService = {
  shouldPromptBackup: jest.fn(() => false),
  saveBackupToStorage: jest.fn(),
};

// Mock the hooks
jest.mock('../../contexts/ServiceProviders', () => ({
  useStorageFactory: () => mockStorageFactory,
}));

jest.mock('../../hooks/queries', () => ({
  ...jest.requireActual('../../hooks/queries'),
  useBaseCurrency: jest.fn(() => 'USD'),
}));

jest.mock('../../hooks/queries/useAccounts', () => ({
  useAccounts: jest.fn(() => []),
}));

jest.mock('../../hooks/queries/useCategories', () => ({
  useCategories: jest.fn(() => []),
}));

jest.mock('../../hooks/queries/useTransactionTypes', () => ({
  useTransactionTypes: jest.fn(() => []),
}));

jest.mock('../../hooks/queries/useTransactions', () => ({
  useTransactions: jest.fn(() => []),
}));

jest.mock('../../hooks/queries/useAssets', () => ({
  useAssets: jest.fn(() => []),
}));

jest.mock('../../hooks/queries/useBudgets', () => ({
  useBudgets: jest.fn(() => []),
}));

describe('PreferencesPage', () => {
  const renderComponent = () =>
    render(
      <AppProvider>
        <MemoryRouter>
          <PreferencesPage />
        </MemoryRouter>
      </AppProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render preferences page with title', () => {
    renderComponent();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Currency Settings')).toBeInTheDocument();
  });

  it('should display current base currency', () => {
    renderComponent();
    // Check that the current currency is displayed in the select
    expect(screen.getByRole('combobox', { name: 'Base Currency' })).toBeInTheDocument();
  });

  it('should display all available currencies', async () => {
    const user = userEvent.setup();
    renderComponent();

    const select = screen.getByLabelText('Base Currency');
    await user.click(select);

    // Check that common currencies are available
    expect(screen.getByRole('option', { name: /USD - US Dollar/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /VND - Vietnamese Dong/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /SGD - Singapore Dollar/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /AUD - Australian Dollar/ })).toBeInTheDocument();
  });

  it('should display helpful description text', () => {
    renderComponent();

    expect(
      screen.getByText(/The base currency is used as the default display currency/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Changing the base currency will recalculate all reports/)
    ).toBeInTheDocument();
  });
});
