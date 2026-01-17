import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { useAppStore } from './stores/useAppStore';

// Mock services
const mockSyncService = {
  startAutoSave: jest.fn(),
  stopAutoSave: jest.fn(),
  setMergeHandler: jest.fn(),
  autoLoad: jest.fn().mockResolvedValue(true),
};

const mockStorageFactory = {
  initialize: jest.fn().mockResolvedValue({ success: true, needsReconnect: false }),
};

const mockBackupService = {
  shouldPromptBackup: jest.fn().mockReturnValue(false),
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
  ServiceProvider: ({ children }: any) => children,
  useStorage: () => mockStorageFactory,
  useSyncService: () => mockSyncService,
  useStorageFactory: () => mockStorageFactory,
  useBackupService: () => mockBackupService,
  useArchiveService: () => mockArchiveService,
  useCalculationService: () => mockCalculationService,
  useReportService: () => mockReportService,
}));

describe('App', () => {
  beforeEach(() => {
    useAppStore.getState().resetState();
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

  it('should start auto-save on mount', async () => {
    render(<App />);
    await waitFor(() => {
      expect(mockSyncService.autoLoad).toHaveBeenCalled();
    });
  });

  it('should stop auto-save on unmount', async () => {
    const { unmount } = render(<App />);
    await waitFor(() => {
      expect(mockSyncService.startAutoSave).toHaveBeenCalled();
    });
    unmount();
    expect(mockSyncService.stopAutoSave).toHaveBeenCalled();
  });
});
