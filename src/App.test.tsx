import { render, screen } from '@testing-library/react';
import App from './App';

// Mock Dexie database
jest.mock('./db/database', () => ({
  db: {
    accounts: { toArray: jest.fn().mockResolvedValue([]) },
    categories: { toArray: jest.fn().mockResolvedValue([]) },
    transactions: { toArray: jest.fn().mockResolvedValue([]) },
    transactionTypes: { toArray: jest.fn().mockResolvedValue([]) },
    budgets: { toArray: jest.fn().mockResolvedValue([]) },
    assets: { toArray: jest.fn().mockResolvedValue([]) },
  },
  syncMetadata: {
    getFileName: jest.fn().mockResolvedValue(null),
    getCloudProvider: jest.fn().mockResolvedValue(null),
    getBaseCurrency: jest.fn().mockResolvedValue('USD'),
    getLastBackupDate: jest.fn().mockResolvedValue(null),
    getLastSynced: jest.fn().mockResolvedValue(null),
  },
}));

// Mock dexie-react-hooks
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn((queryFn) => {
    // Mock the query function to return default values
    const result = queryFn?.();
    if (result?.then) {
      // If it's a promise, we can't resolve it synchronously in tests
      return undefined;
    }
    return result;
  }),
}));

// Mock cloudSync service
jest.mock('./services/cloudSync.service', () => ({
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
jest.mock('./contexts/SyncProvider', () => ({
  SyncProvider: ({ children }: { children: React.ReactNode }) => children,
  useSyncService: () => ({
    isConnected: false,
    providerName: null,
    fileName: null,
    isInitializing: false,
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
  }),
}));

const mockStorageFactory = {
  initialize: jest.fn().mockResolvedValue(true),
  getCurrentFileName: jest.fn().mockReturnValue(null),
  getCurrentProviderName: jest.fn().mockReturnValue(null),
};

const mockArchiveService = {
  identifyArchivableYear: jest.fn().mockReturnValue(null),
  calculateYearEndSummary: jest.fn(),
};

const mockCalculationService = {
  calculateAccountBalance: jest.fn(),
  calculateNetWorth: jest.fn().mockResolvedValue(0),
  getActiveBudgetForPeriod: jest.fn(),
  calculateSavingsRate: jest.fn().mockReturnValue(0),
};

const mockReportService = {
  calculateBalanceSheet: jest.fn(),
  calculateCashFlow: jest.fn().mockResolvedValue({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    incomeByCategory: [],
    expensesByCategory: [],
  }),
  calculateBudgetPerformance: jest.fn().mockResolvedValue({
    overallHealthScore: 0,
    totalBudget: 0,
    totalSpent: 0,
    categories: [],
  }),
};

// Mock ServiceProvider
jest.mock('./contexts/ServiceProviders', () => ({
  ServiceProvider: ({ children }: { children: React.ReactNode }) => children,
  useStorage: () => mockStorageFactory,
  useStorageFactory: () => mockStorageFactory,
  useArchiveService: () => mockArchiveService,
  useCalculationService: () => mockCalculationService,
  useReportService: () => mockReportService,
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the app with Header and Dashboard', () => {
    render(<App />);

    // Check for Header elements
    expect(screen.getByText('Money Tree')).toBeInTheDocument();
    // Sync button only shows when connected, so we don't check for it when not connected

    // Check for Dashboard page title - use getAllByText since it appears in nav and heading
    const dashboardElements = screen.getAllByText('Dashboard');
    expect(dashboardElements.length).toBeGreaterThan(0);
  });
});
