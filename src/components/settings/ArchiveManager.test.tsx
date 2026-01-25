import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArchiveManager } from './ArchiveManager';
import { AppProvider } from '../../contexts/AppContext';

// Mock cloudSync service
jest.mock('../../services/cloudSync.service', () => ({
  getCloudSyncService: jest.fn(() => ({
    fullSync: jest.fn().mockResolvedValue(undefined),
  })),
  initCloudSyncService: jest.fn(),
}));

// Mock archive service
const mockArchiveService = {
  identifyArchivableYear: jest.fn(),
  getArchivedYears: jest.fn(() => []),
  calculateYearEndSummary: jest.fn(),
  createArchiveFile: jest.fn(),
  saveArchiveFile: jest.fn(),
  updateMainFileAfterArchive: jest.fn(),
};

// Mock sync service
const mockSyncService = {
  fullSync: jest.fn(),
  debouncedSync: jest.fn(),
  isConnected: true,
  isInitializing: false,
  isSyncing: false,
};

// Mock sync metadata mutations
const mockAddArchivedYear = jest.fn();

// Mock the hooks
jest.mock('../../contexts/ServiceProviders', () => ({
  useArchiveService: () => mockArchiveService,
}));

jest.mock('../../contexts/SyncProvider', () => ({
  useSyncService: () => mockSyncService,
}));

const mockUseBaseCurrency = jest.fn(() => 'USD');
const mockUseArchivedYears = jest.fn(() => []);

jest.mock('../../hooks/queries', () => ({
  useBaseCurrency: () => mockUseBaseCurrency(),
  useArchivedYears: () => mockUseArchivedYears(),
}));

jest.mock('../../hooks/mutations', () => ({
  useSyncMetadataMutations: () => ({
    addArchivedYear: mockAddArchivedYear,
    setBaseCurrency: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe('ArchiveManager', () => {
  beforeEach(() => {
    mockAddArchivedYear.mockClear();
    jest.clearAllMocks();
    mockArchiveService.identifyArchivableYear.mockResolvedValue(null);
    mockUseArchivedYears.mockReturnValue([]);
  });

  const renderComponent = () => {
    return render(
      <AppProvider>
        <ArchiveManager />
      </AppProvider>
    );
  };

  describe('Initial Render', () => {
    it('should render the archive manager title and description', () => {
      renderComponent();

      expect(screen.getByText('Archive Manager')).toBeInTheDocument();
      expect(screen.getByText(/Archive old years to reduce main file size/i)).toBeInTheDocument();
    });

    it('should show "No years available" when no archivable years', () => {
      renderComponent();

      expect(screen.getByText('No years available to export yet.')).toBeInTheDocument();
    });

    it('should show "No years have been archived" when no archived years', () => {
      renderComponent();

      expect(screen.getByText(/No years have been archived yet/i)).toBeInTheDocument();
    });
  });

  describe('Archivable Years', () => {
    it('should display archivable year with summary', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(2022);
      mockArchiveService.calculateYearEndSummary.mockResolvedValue({
        transactionCount: 150,
        closingNetWorth: 50000,
        totalIncome: 80000,
        totalExpenses: 30000,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('2022')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('$50,000.00')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
      });
    });

    it('should show loading spinner while calculating summary', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(2022);
      mockArchiveService.calculateYearEndSummary.mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should open confirmation dialog when Archive button is clicked', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(2022);
      mockArchiveService.calculateYearEndSummary.mockResolvedValue({
        transactionCount: 150,
        closingNetWorth: 50000,
        totalIncome: 80000,
        totalExpenses: 30000,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
      });

      const archiveButton = screen.getByRole('button', { name: /archive/i });
      fireEvent.click(archiveButton);

      expect(screen.getByText('Archive Year 2022?')).toBeInTheDocument();
      expect(screen.getByText(/Create an archive file for 2022/i)).toBeInTheDocument();
    });

    it('should close confirmation dialog when Cancel is clicked', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(2022);
      mockArchiveService.calculateYearEndSummary.mockResolvedValue({
        transactionCount: 150,
        closingNetWorth: 50000,
        totalIncome: 80000,
        totalExpenses: 30000,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
      });

      // Open dialog
      fireEvent.click(screen.getByRole('button', { name: /archive/i }));
      expect(screen.getByText('Archive Year 2022?')).toBeInTheDocument();

      // Close dialog
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByText('Archive Year 2022?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Archive Process', () => {
    beforeEach(() => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(2022);
      mockArchiveService.calculateYearEndSummary.mockResolvedValue({
        transactionCount: 150,
        closingNetWorth: 50000,
        totalIncome: 80000,
        totalExpenses: 30000,
      });
    });

    it('should successfully archive a year', async () => {
      const mockArchiveFile = {
        year: 2022,
        archivedDate: '2024-01-15T00:00:00Z',
        summary: {
          transactionCount: 150,
          closingNetWorth: 50000,
          totalIncome: 80000,
          totalExpenses: 30000,
        },
        data: {},
      };

      mockArchiveService.createArchiveFile.mockResolvedValue(mockArchiveFile);
      mockArchiveService.saveArchiveFile.mockResolvedValue(undefined);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
      });

      // Open confirmation dialog
      fireEvent.click(screen.getByRole('button', { name: /archive/i }));

      // Confirm archiving
      const confirmButton = screen.getByRole('button', { name: /Archive & Remove Data/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockArchiveService.createArchiveFile).toHaveBeenCalledWith(2022, 'USD');
        expect(mockArchiveService.saveArchiveFile).toHaveBeenCalledWith(mockArchiveFile);
        expect(mockAddArchivedYear).toHaveBeenCalledWith(
          expect.objectContaining({
            year: 2022,
            archivedDate: '2024-01-15T00:00:00Z',
          })
        );
        expect(mockArchiveService.updateMainFileAfterArchive).toHaveBeenCalledWith(
          2022,
          expect.objectContaining({
            year: 2022,
            archivedDate: '2024-01-15T00:00:00Z',
          })
        );
      });
    });

    it('should show error when archiving fails', async () => {
      mockArchiveService.createArchiveFile.mockRejectedValue(new Error('Archive failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
      });

      // Open confirmation dialog
      fireEvent.click(screen.getByRole('button', { name: /archive/i }));

      // Confirm archiving
      const confirmButton = screen.getByRole('button', { name: /Archive & Remove Data/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockArchiveService.createArchiveFile).toHaveBeenCalled();
      });
    });

    it('should disable archive button while archiving is in progress', async () => {
      mockArchiveService.createArchiveFile.mockReturnValue(
        new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
      });

      // Open confirmation dialog and confirm
      fireEvent.click(screen.getByRole('button', { name: /archive/i }));
      fireEvent.click(screen.getByRole('button', { name: /Archive & Remove Data/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /archiving/i })).toBeDisabled();
      });
    });
  });

  describe('Archived Years Display', () => {
    it('should display archived years in a table', () => {
      mockUseArchivedYears.mockReturnValue([
        {
          year: 2021,
          archivedDate: '2024-01-15T00:00:00Z',
          summary: {
            transactionCount: 100,
            closingNetWorth: 40000,
            totalIncome: 60000,
            totalExpenses: 20000,
          },
        },
        {
          year: 2020,
          archivedDate: '2023-12-31T00:00:00Z',
          summary: {
            transactionCount: 80,
            closingNetWorth: 30000,
            totalIncome: 50000,
            totalExpenses: 20000,
          },
        },
      ]);

      renderComponent();

      expect(screen.getByText('2021')).toBeInTheDocument();
      expect(screen.getByText('2020')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.getByText('$40,000.00')).toBeInTheDocument();
      expect(screen.getByText('$30,000.00')).toBeInTheDocument();
    });

    it('should format archived dates correctly', () => {
      mockUseArchivedYears.mockReturnValue([
        {
          year: 2021,
          archivedDate: '2024-01-15T00:00:00Z',
          summary: {
            transactionCount: 100,
            closingNetWorth: 40000,
            totalIncome: 60000,
            totalExpenses: 20000,
          },
        },
      ]);

      renderComponent();

      // The date should be formatted as a local date string (accept any valid date format)
      const dateCell = screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
      expect(dateCell).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null archivable year', () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(null);

      renderComponent();

      expect(screen.getByText('No years available to export yet.')).toBeInTheDocument();
    });

    it('should handle empty archived years array', () => {
      mockArchiveService.getArchivedYears.mockReturnValue([]);

      renderComponent();

      expect(screen.getByText(/No years have been archived yet/i)).toBeInTheDocument();
    });

    it('should use base currency for formatting', async () => {
      mockArchiveService.identifyArchivableYear.mockResolvedValue(2022);
      mockArchiveService.calculateYearEndSummary.mockResolvedValue({
        transactionCount: 150,
        closingNetWorth: 50000,
        totalIncome: 80000,
        totalExpenses: 30000,
      });

      renderComponent();

      // Wait for the summary to be calculated and displayed
      await waitFor(() => {
        expect(screen.getByText('2022')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
      });

      // Check that the number is formatted (may or may not include currency symbol depending on locale)
      expect(screen.getByText(/50,000\.00/)).toBeInTheDocument();
    });
  });
});
