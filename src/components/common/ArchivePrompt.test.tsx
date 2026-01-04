/**
 * ArchivePrompt Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ArchivePrompt } from './ArchivePrompt';
import type { YearEndSummary } from '../../services/archive.service';

describe('ArchivePrompt', () => {
  const mockYearSummary: YearEndSummary = {
    year: 2023,
    transactionCount: 150,
    netWorth: 50000,
    estimatedSizeKB: 75,
  };

  const mockOnArchiveNow = jest.fn();
  const mockOnRemindLater = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render archive prompt with year summary', () => {
    render(
      <ArchivePrompt
        open={true}
        yearSummary={mockYearSummary}
        baseCurrency="usd"
        onArchiveNow={mockOnArchiveNow}
        onRemindLater={mockOnRemindLater}
      />
    );

    expect(screen.getByText('Archive Old Data')).toBeInTheDocument();
    expect(screen.getByText(/Year to Archive: 2023/)).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(/~75 KB/)).toBeInTheDocument();
  });

  it('should call onArchiveNow when Archive Now button is clicked', () => {
    render(
      <ArchivePrompt
        open={true}
        yearSummary={mockYearSummary}
        baseCurrency="usd"
        onArchiveNow={mockOnArchiveNow}
        onRemindLater={mockOnRemindLater}
      />
    );

    const archiveButton = screen.getByRole('button', { name: /Archive Now/i });
    fireEvent.click(archiveButton);

    expect(mockOnArchiveNow).toHaveBeenCalledTimes(1);
  });

  it('should call onRemindLater when Remind Me Later button is clicked', () => {
    render(
      <ArchivePrompt
        open={true}
        yearSummary={mockYearSummary}
        baseCurrency="usd"
        onArchiveNow={mockOnArchiveNow}
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
        yearSummary={mockYearSummary}
        baseCurrency="usd"
        onArchiveNow={mockOnArchiveNow}
        onRemindLater={mockOnRemindLater}
      />
    );

    expect(screen.queryByText('Archive Old Data')).not.toBeInTheDocument();
  });

  it('should display formatted currency for net worth', () => {
    render(
      <ArchivePrompt
        open={true}
        yearSummary={mockYearSummary}
        baseCurrency="usd"
        onArchiveNow={mockOnArchiveNow}
        onRemindLater={mockOnRemindLater}
      />
    );

    // Check for formatted currency (no comma formatting, just $ and amount)
    expect(screen.getByText('$50000.00')).toBeInTheDocument();
  });

  it('should display archive explanation text', () => {
    render(
      <ArchivePrompt
        open={true}
        yearSummary={mockYearSummary}
        baseCurrency="usd"
        onArchiveNow={mockOnArchiveNow}
        onRemindLater={mockOnRemindLater}
      />
    );

    expect(
      screen.getByText(/You have 3 or more years of data in your main file/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Archived data will be saved to a separate file/)
    ).toBeInTheDocument();
  });
});
