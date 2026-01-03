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
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import { Conflict } from '../../services/merge.service';

export interface ConflictResolution {
  conflictIndex: number;
  resolution: 'file' | 'app';
}

export interface MergePreviewDialogProps {
  open: boolean;
  conflicts: Conflict[];
  autoMergedCount: number;
  onCancel: () => void;
  onApply: (resolutions: ConflictResolution[]) => void;
}

export function MergePreviewDialog({
  open,
  conflicts,
  autoMergedCount,
  onCancel,
  onApply,
}: MergePreviewDialogProps) {
  const [resolutions, setResolutions] = React.useState<Map<number, 'file' | 'app'>>(new Map());

  // Initialize resolutions when conflicts change
  React.useEffect(() => {
    const initialResolutions = new Map<number, 'file' | 'app'>();
    conflicts.forEach((_, index) => {
      // Default to app version
      initialResolutions.set(index, 'app');
    });
    setResolutions(initialResolutions);
  }, [conflicts]);

  const handleResolutionChange = (index: number, resolution: 'file' | 'app') => {
    setResolutions((prev) => new Map(prev).set(index, resolution));
  };

  const handleApply = () => {
    const resolutionArray: ConflictResolution[] = Array.from(resolutions.entries()).map(
      ([conflictIndex, resolution]) => ({
        conflictIndex,
        resolution,
      })
    );
    onApply(resolutionArray);
  };

  const formatEntityValue = (entity: unknown): string => {
    if (entity === null) {
      return '(deleted)';
    }
    return JSON.stringify(entity, null, 2);
  };

  const getConflictDescription = (conflict: Conflict): string => {
    if (conflict.conflictReason === 'delete-modify') {
      if (conflict.fileVersion === null) {
        return 'Deleted in file, modified in app';
      }
      return 'Deleted in app, modified in file';
    }
    return 'Modified in both file and app';
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="lg" fullWidth>
      <DialogTitle>Merge Conflicts Detected</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            The file was modified externally. Review the changes below and choose which version to
            keep for each conflict.
          </Alert>

          {autoMergedCount > 0 && (
            <Box sx={{ mb: 2 }}>
              <Chip label={`${autoMergedCount} changes auto-merged`} color="success" size="small" />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} requiring your decision
          </Typography>
        </Box>

        {conflicts.length === 0 ? (
          <Alert severity="success">No conflicts! All changes were merged automatically.</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {conflicts.map((conflict, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {conflict.type}: {conflict.entityName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getConflictDescription(conflict)}
                    </Typography>
                  </Box>

                  <RadioGroup
                    value={resolutions.get(index) || 'app'}
                    onChange={(e) =>
                      handleResolutionChange(index, e.target.value as 'file' | 'app')
                    }
                  >
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      {/* External Changes */}
                      <Box>
                        <FormControlLabel
                          value="file"
                          control={<Radio />}
                          label={
                            <Typography variant="body2" fontWeight="bold">
                              Keep External Changes
                            </Typography>
                          }
                        />
                        <Box
                          sx={{
                            bgcolor: 'grey.50',
                            p: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor:
                              resolutions.get(index) === 'file' ? 'primary.main' : 'grey.300',
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              whiteSpace: 'pre-wrap',
                              m: 0,
                            }}
                          >
                            {formatEntityValue(conflict.fileVersion)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Your Changes */}
                      <Box>
                        <FormControlLabel
                          value="app"
                          control={<Radio />}
                          label={
                            <Typography variant="body2" fontWeight="bold">
                              Keep Your Changes
                            </Typography>
                          }
                        />
                        <Box
                          sx={{
                            bgcolor: 'grey.50',
                            p: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor:
                              resolutions.get(index) === 'app' ? 'primary.main' : 'grey.300',
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              whiteSpace: 'pre-wrap',
                              m: 0,
                            }}
                          >
                            {formatEntityValue(conflict.appVersion)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </RadioGroup>
                </CardContent>
                {index < conflicts.length - 1 && <Divider />}
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          Apply Merge
        </Button>
      </DialogActions>
    </Dialog>
  );
}
