import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import WarningIcon from '@mui/icons-material/Warning';
import { useArchiveService } from '@/hooks/useServices';
import { useAppContext } from '@/hooks/useApp';
import { formatCurrency } from '../../utils/currency.utils';
import type { YearEndSummary } from '../../types/models';
import { useBaseCurrency, useArchivedYears } from '../../hooks/useSyncMetadata';
import { useSyncMetadataService } from '@/hooks/useServices';
import { CurrencyCode } from '../../types/enums';

export const ArchiveManager: React.FC = () => {
  const syncMetadataService = useSyncMetadataService();
  const archiveService = useArchiveService();
  const { showSnackbar } = useAppContext();
  const baseCurrency = useBaseCurrency() ?? CurrencyCode.USD;
  const archivedYears = useArchivedYears();
  const [isExporting, setIsExporting] = useState(false);
  const [exportingYear, setExportingYear] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; year: number | null }>({
    open: false,
    year: null,
  });
  const [yearSummaries, setYearSummaries] = useState<Record<number, YearEndSummary>>({});
  const [archivableYear, setArchivableYear] = useState<number | null>(null);

  // Get archivable year
  useEffect(() => {
    let isMounted = true;

    const getArchivableYear = async () => {
      const year = await archiveService.identifyArchivableYear();
      if (isMounted) {
        setArchivableYear(year);
      }
    };

    getArchivableYear();

    return () => {
      isMounted = false;
    };
  }, [archiveService]);

  // Calculate summary for archivable year
  useEffect(() => {
    let isMounted = true;

    const calculateSummary = async () => {
      if (archivableYear !== null) {
        const summary = await archiveService.calculateYearEndSummary(archivableYear, baseCurrency);
        if (isMounted) {
          setYearSummaries({ [archivableYear]: summary });
        }
      } else {
        setYearSummaries({});
      }
    };

    calculateSummary();

    return () => {
      isMounted = false;
    };
  }, [archivableYear, baseCurrency, archiveService]);

  const handleExportYear = async (year: number) => {
    // Close confirmation dialog
    setConfirmDialog({ open: false, year: null });

    setIsExporting(true);
    setExportingYear(year);

    try {
      // Create archive file
      const archiveFile = await archiveService.createArchiveFile(year, baseCurrency);

      // Save archive (removes transactions, updates balances, removes budgets)
      await archiveService.saveArchiveFile(archiveFile);

      // Create and add archive reference (sync triggered automatically)
      const archiveReference = {
        year,
        archivedDate: archiveFile.archivedDate,
        summary: archiveFile.summary,
      };
      await syncMetadataService.addArchivedYear(archiveReference);
      // Sync triggered automatically by SyncProvider watching lastModified

      // Update main file - remove archived data
      archiveService.updateMainFileAfterArchive(year, archiveReference);

      showSnackbar(
        `Year ${year} archived successfully. Data has been removed from the main file.`,
        'success'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export archive';
      showSnackbar(message, 'error');
    } finally {
      setIsExporting(false);
      setExportingYear(null);
    }
  };

  const handleOpenConfirmDialog = (year: number) => {
    setConfirmDialog({ open: true, year });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, year: null });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Archive Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Archive old years to reduce main file size. Archived data is saved to a separate file and
        removed from your main data file.
      </Typography>

      {/* Available Years to Export */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Available Years
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Archive a year to save it to a separate file and remove it from your main data file. This
          helps keep your main file smaller and faster.
        </Typography>

        {archivableYear === null ? (
          <Alert severity="info">No years available to export yet.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                  <TableCell align="right">Net Worth</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const summary = yearSummaries[archivableYear];
                  const isCurrentlyExporting = isExporting && exportingYear === archivableYear;

                  if (!summary) {
                    return (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <CircularProgress size={20} />
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow>
                      <TableCell>
                        <strong>{archivableYear}</strong>
                      </TableCell>
                      <TableCell align="right">{summary.transactionCount}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(summary.closingNetWorth, baseCurrency)}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={
                            isCurrentlyExporting ? <CircularProgress size={16} /> : <ArchiveIcon />
                          }
                          onClick={() => handleOpenConfirmDialog(archivableYear)}
                          disabled={isExporting}
                        >
                          {isCurrentlyExporting ? 'Archiving...' : 'Archive'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Archived Years (for future implementation) */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Archived Years
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Years that have been removed from the main file through the archive process.
        </Typography>

        {!archivedYears || archivedYears.length === 0 ? (
          <Alert severity="info" icon={<ArchiveIcon />}>
            No years have been archived yet. When you have 3+ years of data, you can archive older
            years to keep your main file lightweight.
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  <TableCell>Archived Date</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                  <TableCell align="right">Net Worth</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {archivedYears.map((archived) => (
                  <TableRow key={archived.year}>
                    <TableCell>
                      <Chip label={archived.year} size="small" color="default" />
                    </TableCell>
                    <TableCell>{new Date(archived.archivedDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{archived.summary.transactionCount}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(archived.summary.closingNetWorth, baseCurrency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Archive Year {confirmDialog.year}?
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>This will:</DialogContentText>
          <Box component="ul" sx={{ mt: 1, mb: 1 }}>
            <li>Create an archive file for {confirmDialog.year}</li>
            <li>
              <strong>Remove all {confirmDialog.year} data from your main file</strong>
            </li>
            <li>Save changes to your storage provider</li>
          </Box>
          <DialogContentText>
            This action cannot be undone. Make sure you have a backup of your data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button
            onClick={() => confirmDialog.year && handleExportYear(confirmDialog.year)}
            variant="contained"
            color="warning"
          >
            Archive & Remove Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
