/**
 * ArchivePrompt Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ArchivePrompt } from './ArchivePrompt';
import type { YearEndSummary } from '@/types/models';
import { CurrencyCode } from '@/types/enums';

describe('ArchivePrompt', () => {
  const mockYearSummary: YearEndSummary = {
    transactionCount: 150,
    closingNetWorth: 50000,
    closingBalances: {},
    closingAssetValuations: {},
  };

  const mockOnGoToSettings = jest.fn();
  const mockOnRemindLater = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render archive prompt with year summary', () => {
    render(
      <ArchivePrompt
        open={true}
        year={2023}
        yearSummary={mockYearSummary}
        baseCurrency={CurrencyCode.USD}
        onGoToSettings={mockOnGoToSettings}
        onRemindLater={mockOnRemindLater}
      />
    );

    expect(screen.getByText('Archive Old Data')).toBeInTheDocument();
    expect(screen.getByText(/Year to Archive: 2023/)).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should call onGoToSettings when Go to Archive Settings button is clicked', () => {
    render(
      <ArchivePrompt
        open={true}
        year={2023}
        yearSummary={mockYearSummary}
        baseCurrency={CurrencyCode.USD}
        onGoToSettings={mockOnGoToSettings}
        onRemindLater={mockOnRemindLater}
      />
    );

    const archiveButton = screen.getByRole('button', { name: /Go to Archive Settings/i });
    fireEvent.click(archiveButton);

    expect(mockOnGoToSettings).toHaveBeenCalledTimes(1);
  });

  it('should call onRemindLater when Remind Me Later button is clicked', () => {
    render(
      <ArchivePrompt
        open={true}
        year={2023}
        yearSummary={mockYearSummary}
        baseCurrency={CurrencyCode.USD}
        onGoToSettings={mockOnGoToSettings}
        onRemindLater={mockOnRemindLater}
      />
    );

    const remindButton = screen.getByRole('button', { name: /Remind Me Later/i });
    fireEvent.click(remindButton);

    expect(mockOnRemindLater).toHaveBeenCalledTimes(1);
  });

  it('should not render when open is false', () => {
    render(
      <ArchivePrompt
        open={false}
        year={2023}
        yearSummary={mockYearSummary}
        baseCurrency={CurrencyCode.USD}
        onGoToSettings={mockOnGoToSettings}
        onRemindLater={mockOnRemindLater}
      />
    );

    expect(screen.queryByText('Archive Old Data')).not.toBeInTheDocument();
  });

  it('should display formatted currency for net worth', () => {
    render(
      <ArchivePrompt
        open={true}
        year={2023}
        yearSummary={mockYearSummary}
        baseCurrency={CurrencyCode.USD}
        onGoToSettings={mockOnGoToSettings}
        onRemindLater={mockOnRemindLater}
      />
    );

    // Check for formatted currency with comma
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
  });

  it('should display archive explanation text', () => {
    render(
      <ArchivePrompt
        open={true}
        year={2023}
        yearSummary={mockYearSummary}
        baseCurrency={CurrencyCode.USD}
        onGoToSettings={mockOnGoToSettings}
        onRemindLater={mockOnRemindLater}
      />
    );

    expect(
      screen.getByText(/You have 3 or more years of data in your main file/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Archived data will be saved to a separate file/)).toBeInTheDocument();
  });
});
