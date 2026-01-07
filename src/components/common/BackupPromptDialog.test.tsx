/**
 * BackupPromptDialog Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BackupPromptDialog } from './BackupPromptDialog';

describe('BackupPromptDialog', () => {
  const mockOnGoToSettings = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when open is false', () => {
    render(
      <BackupPromptDialog
        open={false}
        lastBackupDate={null}
        onGoToSettings={mockOnGoToSettings}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByText('Backup Reminder')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(
      <BackupPromptDialog
        open={true}
        lastBackupDate={null}
        onGoToSettings={mockOnGoToSettings}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Backup Reminder')).toBeInTheDocument();
  });

  it('should show "Never backed up" when lastBackupDate is null', () => {
    render(
      <BackupPromptDialog
        open={true}
        lastBackupDate={null}
        onGoToSettings={mockOnGoToSettings}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText(/you haven't backed up your data yet/i)).toBeInTheDocument();
  });

  it('should show days since last backup when date is provided', () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    render(
      <BackupPromptDialog
        open={true}
        lastBackupDate={thirtyDaysAgo.toISOString()}
        onGoToSettings={mockOnGoToSettings}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText(/it's been 30 days since your last backup/i)).toBeInTheDocument();
  });

  it('should call onGoToSettings when "Go to Backup Settings" is clicked', () => {
    render(
      <BackupPromptDialog
        open={true}
        lastBackupDate={null}
        onGoToSettings={mockOnGoToSettings}
        onDismiss={mockOnDismiss}
      />
    );

    const goToSettingsButton = screen.getByRole('button', { name: /go to backup settings/i });
    fireEvent.click(goToSettingsButton);

    expect(mockOnGoToSettings).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when "Remind Me Later" is clicked', () => {
    render(
      <BackupPromptDialog
        open={true}
        lastBackupDate={null}
        onGoToSettings={mockOnGoToSettings}
        onDismiss={mockOnDismiss}
      />
    );

    const remindLaterButton = screen.getByRole('button', { name: /remind me later/i });
    fireEvent.click(remindLaterButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should display backup recommendation message', () => {
    render(
      <BackupPromptDialog
        open={true}
        lastBackupDate={null}
        onGoToSettings={mockOnGoToSettings}
        onDismiss={mockOnDismiss}
      />
    );

    expect(
      screen.getByText(/regular backups protect your financial data from unexpected issues/i)
    ).toBeInTheDocument();
  });
});
