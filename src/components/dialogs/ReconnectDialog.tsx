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
import { CloudOff as CloudOffIcon } from '@mui/icons-material';
import type { CloudService } from '../../services/cloud.service';

interface ReconnectDialogProps {
  cloudService: CloudService;
  fileName: string;
  error: string | null;
  onReconnect: () => void;
  onCancel: () => void;
}

export const ReconnectDialog: React.FC<ReconnectDialogProps> = ({
  cloudService,
  fileName,
  error,
  onReconnect,
  onCancel,
}) => {
  const providerName = cloudService.getProviderName() || 'Cloud';
  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudOffIcon color="warning" />
          <Typography variant="h6" component="div">
            Session Expired
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Your {providerName} session has expired. Please reconnect to continue syncing with{' '}
          <strong>{fileName}</strong>.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          Your data is safe and stored locally. Reconnecting will restore cloud sync.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel}>Work Offline</Button>
        <Button onClick={onReconnect} variant="contained">
          Reconnect
        </Button>
      </DialogActions>
    </Dialog>
  );
};
