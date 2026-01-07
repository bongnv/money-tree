import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Backup as BackupIcon } from '@mui/icons-material';

interface BackupPromptDialogProps {
  open: boolean;
  lastBackupDate?: string | null;
  onGoToSettings: () => void;
  onDismiss: () => void;
}

export const BackupPromptDialog: React.FC<BackupPromptDialogProps> = ({
  open,
  lastBackupDate,
  onGoToSettings,
  onDismiss,
}) => {
  const getDaysSinceBackup = (): number | null => {
    if (!lastBackupDate) return null;

    const lastBackup = new Date(lastBackupDate);
    const now = new Date();
    return Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysSinceBackup = getDaysSinceBackup();

  return (
    <Dialog open={open} onClose={onDismiss} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BackupIcon color="warning" />
          <span>Backup Reminder</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {daysSinceBackup === null ? (
            <>You haven't backed up your data yet.</>
          ) : (
            <>
              It's been {daysSinceBackup} day{daysSinceBackup !== 1 ? 's' : ''} since your last
              backup.
            </>
          )}
        </Alert>
        <Typography variant="body1" paragraph>
          Regular backups protect your financial data from unexpected issues. We recommend backing
          up at least once a month.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Backups are compressed and can be saved to your local storage or OneDrive.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onDismiss} color="inherit">
          Remind Me Later
        </Button>
        <Button onClick={onGoToSettings} variant="contained" color="primary" autoFocus>
          Go to Backup Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};
