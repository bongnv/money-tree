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

// Mock Dexie hooks
jest.mock('./hooks/queries', () => ({
  ...jest.requireActual('./hooks/queries'),
  useBaseCurrency: jest.fn(() => 'USD'),
  useCloudFileName: jest.fn(() => null),
  useLastSynced: jest.fn(() => null),
}));

// Mock cloudSync service
jest.mock('./services/cloudSync.service', () => ({
  initCloudSyncService: jest.fn(),
  getCloudSyncService: jest.fn(),
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

const mockSyncService = {
  fullSync: jest.fn(),
  downloadCurrentFile: jest.fn(),
  uploadCurrentFile: jest.fn(),
};

// Mock ServiceProvider
jest.mock('./contexts/ServiceProviders', () => ({
  ServiceProvider: ({ children }: any) => children,
  useStorage: () => mockStorageFactory,
  useStorageFactory: () => mockStorageFactory,
  useArchiveService: () => mockArchiveService,
  useCalculationService: () => mockCalculationService,
  useReportService: () => mockReportService,
  useSyncService: () => mockSyncService,
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the app with Header and Dashboard', () => {
    render(<App />);

    // Check for Header elements
    expect(screen.getByText('Money Tree')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sync/i })).toBeInTheDocument();

    // Check for Dashboard page title - use getAllByText since it appears in nav and heading
    const dashboardElements = screen.getAllByText('Dashboard');
    expect(dashboardElements.length).toBeGreaterThan(0);
  });
});
