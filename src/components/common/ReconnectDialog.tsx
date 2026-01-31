import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface ReconnectDialogProps {
  open: boolean;
  providerName: string;
  onReconnect: () => void;
  onDismiss: () => void;
}

/**
 * Dialog shown when cloud storage authentication expires
 * Offers options to reconnect or return to welcome screen
 */
const ReconnectDialog: React.FC<ReconnectDialogProps> = ({
  open,
  providerName,
  onReconnect,
  onDismiss,
}) => {
  return (
    <Dialog open={open} onClose={onDismiss} maxWidth="sm" fullWidth>
      <DialogTitle>Session Expired</DialogTitle>
      <DialogContent>
        <Typography>
          Your {providerName} session has expired. Would you like to reconnect or choose a different
          storage option?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDismiss} color="inherit">
          Choose Storage
        </Button>
        <Button onClick={onReconnect} variant="contained" color="primary" autoFocus>
          Reconnect to {providerName}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReconnectDialog;
