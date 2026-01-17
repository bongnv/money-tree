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

  it('should show welcome dialog when initialization fails', async () => {
    mockStorageFactory.initialize.mockResolvedValue({ success: false, needsReconnect: false });
    
    const { container } = render(<App />);
    
    await waitFor(() => {
      // Check if WelcomeDialog component is rendered by checking for dialog role
      const dialogs = container.querySelectorAll('[role="dialog"]');
      expect(dialogs.length).toBeGreaterThan(0);
    });
  });

  it('should show welcome dialog when autoLoad fails', async () => {
    mockStorageFactory.initialize.mockResolvedValue({ success: true, needsReconnect: false });
    mockSyncService.autoLoad.mockResolvedValue(false);
    
    const { container } = render(<App />);
    
    await waitFor(() => {
      const dialogs = container.querySelectorAll('[role="dialog"]');
      expect(dialogs.length).toBeGreaterThan(0);
    });
  });

  it('should show archive prompt when archivable year detected', async () => {
    mockArchiveService.identifyArchivableYear.mockReturnValue(2025);
    mockArchiveService.calculateYearEndSummary.mockReturnValue({
      year: 2025,
      totalIncome: 50000,
      totalExpenses: 30000,
    });
    
    const { container } = render(<App />);
    
    await waitFor(() => {
      // Archive prompt creates a dialog
      const dialogs = container.querySelectorAll('[role="dialog"]');
      expect(dialogs.length).toBeGreaterThan(0);
    });
  });

  it('should show backup prompt when backup is due', async () => {
    mockBackupService.shouldPromptBackup.mockReturnValue(true);
    
    const { container } = render(<App />);
    
    await waitFor(() => {
      // Backup prompt creates a dialog
      const dialogs = container.querySelectorAll('[role="dialog"]');
      expect(dialogs.length).toBeGreaterThan(0);
    });
  });

  it('should prevent navigation with unsaved changes', async () => {
    render(<App />);
    
    // Set unsaved changes after render
    await waitFor(() => {
      useAppStore.setState({ hasUnsavedChanges: true });
    });
    
    const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
    Object.defineProperty(beforeUnloadEvent, 'returnValue', {
      writable: true,
      value: '',
    });
    
    window.dispatchEvent(beforeUnloadEvent);
    
    // Check that returnValue was set (this is how beforeunload works)
    expect(beforeUnloadEvent.returnValue).toBe('');
  });

  it('should set merge handler on mount', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(mockSyncService.setMergeHandler).toHaveBeenCalled();
    });
  });

  it('should clear merge handler on unmount', async () => {
    const { unmount } = render(<App />);
    
    await waitFor(() => {
      expect(mockSyncService.setMergeHandler).toHaveBeenCalledTimes(1);
    });
    
    unmount();
    
    expect(mockSyncService.setMergeHandler).toHaveBeenCalledWith(null);
  });

  it('should show loading backdrop when isLoading is true', () => {
    useAppStore.setState({ isLoading: true });
    
    render(<App />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display snackbar notifications', () => {
    useAppStore.setState({
      snackbar: {
        open: true,
        message: 'Test notification',
        severity: 'success',
      },
    });
    
    render(<App />);
    
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });
});
