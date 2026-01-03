import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  FolderOpen as FolderOpenIcon,
  Cloud as CloudIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface WelcomeDialogProps {
  open: boolean;
  onOpenLocalFile: () => void;
  onConnectOneDrive: () => void;
  onStartEmpty: (dontShowAgain: boolean) => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  open,
  onOpenLocalFile,
  onConnectOneDrive: _onConnectOneDrive,
  onStartEmpty,
}) => {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  const handleStartEmpty = () => {
    onStartEmpty(dontShowAgain);
  };

  return (
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div" fontWeight="bold">
          Welcome to Money Tree
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Choose how you'd like to manage your financial data:
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Open Local File */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <FolderOpenIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h6" component="div">
                    Open Local File
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open an existing Money Tree file from your computer
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<FolderOpenIcon />}
                onClick={onOpenLocalFile}
                fullWidth
              >
                Open File
              </Button>
            </CardActions>
          </Card>

          {/* Connect to OneDrive */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <CloudIcon color="disabled" fontSize="large" />
                <Box>
                  <Typography variant="h6" component="div" color="text.disabled">
                    Connect to OneDrive
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Sync your data with Microsoft OneDrive (Coming Soon)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button variant="outlined" startIcon={<CloudIcon />} disabled fullWidth>
                Coming Soon
              </Button>
            </CardActions>
          </Card>

          {/* Start with Empty Data */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <AddIcon color="action" fontSize="large" />
                <Box>
                  <Typography variant="h6" component="div">
                    Start with Empty Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a new Money Tree file from scratch
                  </Typography>
                </Box>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Don't show this dialog again
                  </Typography>
                }
                sx={{ mt: 1 }}
              />
            </CardContent>
            <CardActions>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleStartEmpty}
                fullWidth
              >
                Start Empty
              </Button>
            </CardActions>
          </Card>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          You can change your data storage location later in Settings
        </Typography>
      </DialogActions>
    </Dialog>
  );
};
