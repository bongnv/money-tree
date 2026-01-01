import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface FileLoadErrorDialogProps {
  open: boolean;
  error: string | null;
  onClose: () => void;
}

export const FileLoadErrorDialog: React.FC<FileLoadErrorDialogProps> = ({
  open,
  error,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Failed to Load File</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {error || 'An unknown error occurred while loading the file.'}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

