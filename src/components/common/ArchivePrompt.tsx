import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { formatCurrency } from '../../utils/currency.utils';
import type { YearEndSummary } from '../../services/archive.service';

export interface ArchivePromptProps {
  open: boolean;
  yearSummary: YearEndSummary;
  baseCurrency: string;
  onArchiveNow: () => void;
  onRemindLater: () => void;
}

export const ArchivePrompt: React.FC<ArchivePromptProps> = ({
  open,
  yearSummary,
  baseCurrency,
  onArchiveNow,
  onRemindLater,
}) => {
  return (
    <Dialog open={open} onClose={onRemindLater} maxWidth="sm" fullWidth>
      <DialogTitle>Archive Old Data</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have 3 or more years of data in your main file. To keep the file size manageable and
          improve performance, consider archiving older data.
        </DialogContentText>

        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Year to Archive: {yearSummary.year}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Transactions:
              </Typography>
              <Typography variant="body2">{yearSummary.transactionCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Year-end Net Worth:
              </Typography>
              <Typography variant="body2">
                {formatCurrency(yearSummary.netWorth, baseCurrency)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Estimated Size Savings:
              </Typography>
              <Typography variant="body2">~{yearSummary.estimatedSizeKB} KB</Typography>
            </Box>
          </Box>
        </Box>

        <DialogContentText sx={{ mt: 2, fontSize: '0.875rem' }}>
          Archived data will be saved to a separate file and can be accessed anytime through the
          Settings page.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onRemindLater}>Remind Me Later</Button>
        <Button onClick={onArchiveNow} variant="contained" color="primary">
          Archive Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};
