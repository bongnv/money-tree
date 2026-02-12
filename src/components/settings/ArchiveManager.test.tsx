import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as useArchiveManagerHook from '@/hooks/useArchiveManager';
import { CurrencyCode } from '@/types/enums';
import type { YearEndSummary } from '@/types/models';
import { ArchiveManager } from './ArchiveManager';

jest.mock('@/hooks/useArchiveManager');

const mockUseArchiveManager = useArchiveManagerHook.useArchiveManager as jest.MockedFunction<
  typeof useArchiveManagerHook.useArchiveManager
>;

describe('ArchiveManager', () => {
  const mockHandleExportYear = jest.fn();
  const mockHandleOpenConfirmDialog = jest.fn();
  const mockHandleCloseConfirmDialog = jest.fn();

  const createYearSummary = (
    transactionCount: number,
    closingNetWorth: number
  ): YearEndSummary => ({
    transactionCount,
    closingNetWorth,
    closingBalances: {},
    closingAssetValuations: {},
  });

  const defaultHookReturn = {
    archivableYear: null,
    yearSummaries: {},
    archivedYears: [],
    baseCurrency: CurrencyCode.USD,
    isExporting: false,
    exportingYear: null,
    confirmDialog: { open: false, year: null },
    handleExportYear: mockHandleExportYear,
    handleOpenConfirmDialog: mockHandleOpenConfirmDialog,
    handleCloseConfirmDialog: mockHandleCloseConfirmDialog,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseArchiveManager.mockReturnValue(defaultHookReturn);
  });

  it('should render archive manager heading', () => {
    render(<ArchiveManager />);
    expect(screen.getByText('Archive Manager')).toBeInTheDocument();
  });

  it('should show info message when no years available to export', () => {
    render(<ArchiveManager />);
    expect(screen.getByText('No years available to export yet.')).toBeInTheDocument();
  });

  it('should display archivable year with summary data', () => {
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      archivableYear: 2022,
      yearSummaries: {
        2022: createYearSummary(150, 50000),
      },
    });

    render(<ArchiveManager />);

    expect(screen.getByText('2022')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
  });

  it('should show loading spinner when summary is not available', () => {
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      archivableYear: 2022,
      yearSummaries: {},
    });

    render(<ArchiveManager />);

    // CircularProgress should be in the table
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should show archive button and handle click', async () => {
    const user = userEvent.setup();
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      archivableYear: 2022,
      yearSummaries: {
        2022: createYearSummary(150, 50000),
      },
    });

    render(<ArchiveManager />);

    const archiveButton = screen.getByRole('button', { name: /Archive/i });
    expect(archiveButton).toBeInTheDocument();

    await user.click(archiveButton);
    expect(mockHandleOpenConfirmDialog).toHaveBeenCalledWith(2022);
  });

  it('should disable archive button when exporting', () => {
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      archivableYear: 2022,
      yearSummaries: {
        2022: createYearSummary(150, 50000),
      },
      isExporting: true,
      exportingYear: 2022,
    });

    render(<ArchiveManager />);

    const archiveButton = screen.getByRole('button', { name: /Archiving\.\.\./i });
    expect(archiveButton).toBeDisabled();
  });

  it('should show no archived years message when empty', () => {
    render(<ArchiveManager />);
    expect(screen.getByText(/No years have been archived yet/i)).toBeInTheDocument();
  });

  it('should display archived years list', () => {
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      archivedYears: [
        {
          year: 2021,
          archivedDate: '2023-01-15T00:00:00.000Z',
          summary: createYearSummary(200, 45000),
        },
        {
          year: 2020,
          archivedDate: '2022-01-10T00:00:00.000Z',
          summary: createYearSummary(180, 40000),
        },
      ],
    });

    render(<ArchiveManager />);

    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('$45,000.00')).toBeInTheDocument();
    expect(screen.getByText('$40,000.00')).toBeInTheDocument();
  });

  it('should not show confirmation dialog when closed', () => {
    render(<ArchiveManager />);
    expect(screen.queryByText(/Archive Year/i)).not.toBeInTheDocument();
  });

  it('should show confirmation dialog when open', () => {
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      confirmDialog: { open: true, year: 2022 },
    });

    render(<ArchiveManager />);

    expect(screen.getByText('Archive Year 2022?')).toBeInTheDocument();
    expect(screen.getByText(/This will:/i)).toBeInTheDocument();
    expect(screen.getByText(/Create an archive file for 2022/i)).toBeInTheDocument();
  });

  it('should handle cancel in confirmation dialog', async () => {
    const user = userEvent.setup();
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      confirmDialog: { open: true, year: 2022 },
    });

    render(<ArchiveManager />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockHandleCloseConfirmDialog).toHaveBeenCalled();
  });

  it('should handle confirm in confirmation dialog', async () => {
    const user = userEvent.setup();
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      confirmDialog: { open: true, year: 2022 },
    });

    render(<ArchiveManager />);

    const confirmButton = screen.getByRole('button', { name: /Archive & Remove Data/i });
    await user.click(confirmButton);

    expect(mockHandleExportYear).toHaveBeenCalledWith(2022);
  });

  it('should not call handleExportYear when year is null', async () => {
    const user = userEvent.setup();
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      confirmDialog: { open: true, year: null },
    });

    render(<ArchiveManager />);

    const confirmButton = screen.getByRole('button', { name: /Archive & Remove Data/i });
    await user.click(confirmButton);

    expect(mockHandleExportYear).not.toHaveBeenCalled();
  });

  it('should format archived date correctly', () => {
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      archivedYears: [
        {
          year: 2021,
          archivedDate: '2023-06-15T12:00:00.000Z',
          summary: createYearSummary(100, 30000),
        },
      ],
    });

    render(<ArchiveManager />);

    // Check that a date is displayed (format may vary by locale)
    const dateCell = screen.getByText(/2023|6\/15\/2023|15\/6\/2023/);
    expect(dateCell).toBeInTheDocument();
  });

  it('should display currency with correct base currency', () => {
    mockUseArchiveManager.mockReturnValue({
      ...defaultHookReturn,
      archivableYear: 2022,
      baseCurrency: CurrencyCode.AUD,
      yearSummaries: {
        2022: createYearSummary(150, 50000),
      },
    });

    render(<ArchiveManager />);

    expect(screen.getByText('A$50,000.00')).toBeInTheDocument();
  });
});
