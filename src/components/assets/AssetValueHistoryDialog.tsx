import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { ManualAsset } from '../../types/models';
import { formatCurrency } from '../../utils/currency.utils';
import { formatDate } from '../../utils/date.utils';
import { LineChart } from '../charts/LineChart';
import { getCompleteValueHistory, calculateAssetValueGrowth } from '../../services/history.service';

export interface AssetValueHistoryDialogProps {
  open: boolean;
  asset: ManualAsset | null;
  onClose: () => void;
}

type DateRange = '3m' | '6m' | '1y' | 'all';

export const AssetValueHistoryDialog: React.FC<AssetValueHistoryDialogProps> = ({
  open,
  asset,
  onClose,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>('all');

  if (!asset) return null;

  const completeHistory = getCompleteValueHistory(asset);
  const growth = completeHistory.length >= 2 ? calculateAssetValueGrowth(asset) : null;

  const handleDateRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRange: DateRange | null
  ) => {
    if (newRange !== null) {
      setDateRange(newRange);
    }
  };

  const getFilteredChartData = () => {
    if (completeHistory.length === 0) return [];

    const today = new Date();
    let cutoffDate: Date;

    switch (dateRange) {
      case '3m':
        cutoffDate = new Date(today.setMonth(today.getMonth() - 3));
        break;
      case '6m':
        cutoffDate = new Date(today.setMonth(today.getMonth() - 6));
        break;
      case '1y':
        cutoffDate = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      case 'all':
      default:
        return completeHistory.map((entry) => ({
          name: new Date(entry.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          Value: entry.value,
        }));
    }

    const filtered = completeHistory.filter((entry) => new Date(entry.date) >= cutoffDate);
    return filtered.map((entry) => ({
      name: new Date(entry.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      Value: entry.value,
    }));
  };

  // Get historical entries only (excluding current value)
  const historicalEntries = asset.valueHistory || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">{asset.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Current Value: {formatCurrency(asset.value, asset.currencyId)}
            </Typography>
          </Box>
          {growth && (
            <Chip
              icon={growth.percentageChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${growth.percentageChange >= 0 ? '+' : ''}${growth.percentageChange.toFixed(1)}%`}
              color={growth.percentageChange >= 0 ? 'success' : 'error'}
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Chart Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Value Over Time
            </Typography>
            <ToggleButtonGroup
              value={dateRange}
              exclusive
              onChange={handleDateRangeChange}
              size="small"
            >
              <ToggleButton value="3m">3 Months</ToggleButton>
              <ToggleButton value="6m">6 Months</ToggleButton>
              <ToggleButton value="1y">1 Year</ToggleButton>
              <ToggleButton value="all">All Time</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <LineChart
            data={getFilteredChartData()}
            lines={[{ dataKey: 'Value', name: 'Value', color: '#1976d2' }]}
            height={300}
            formatValue={(value) => formatCurrency(value, asset.currencyId)}
          />
        </Paper>

        {/* Growth Metrics */}
        {growth && (
          <Paper sx={{ p: 2, mb: 3, backgroundColor: 'action.hover' }}>
            <Typography variant="subtitle2" gutterBottom>
              Growth Metrics
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Start Value
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(growth.startValue, asset.currencyId)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(growth.startDate)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Current Value
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(growth.endValue, asset.currencyId)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(growth.endDate)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Change
                </Typography>
                <Typography
                  variant="body1"
                  color={growth.absoluteChange >= 0 ? 'success.main' : 'error.main'}
                >
                  {growth.absoluteChange >= 0 ? '+' : ''}
                  {formatCurrency(growth.absoluteChange, asset.currencyId)}
                </Typography>
                <Typography
                  variant="caption"
                  color={growth.percentageChange >= 0 ? 'success.main' : 'error.main'}
                >
                  {growth.percentageChange >= 0 ? '+' : ''}
                  {growth.percentageChange.toFixed(2)}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Historical Values Table */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Value History
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">Change</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Current value row */}
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell>
                  <strong>{formatDate(asset.date)}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{formatCurrency(asset.value, asset.currencyId)}</strong>
                </TableCell>
                <TableCell align="right">
                  {historicalEntries.length > 0 && (
                    <Typography
                      variant="body2"
                      color={
                        asset.value - historicalEntries[historicalEntries.length - 1].value >= 0
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      {asset.value - historicalEntries[historicalEntries.length - 1].value >= 0
                        ? '+'
                        : ''}
                      {formatCurrency(
                        asset.value - historicalEntries[historicalEntries.length - 1].value,
                        asset.currencyId
                      )}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <em>Current Value</em>
                </TableCell>
              </TableRow>

              {/* Historical entries */}
              {historicalEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No historical values recorded yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                historicalEntries.map((entry, index) => {
                  const nextValue =
                    index === historicalEntries.length - 1
                      ? asset.value
                      : historicalEntries[index + 1].value;
                  const change = nextValue - entry.value;

                  return (
                    <TableRow key={index}>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.value, asset.currencyId)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={change >= 0 ? 'success.main' : 'error.main'}
                        >
                          {change >= 0 ? '+' : ''}
                          {formatCurrency(change, asset.currencyId)}
                        </Typography>
                      </TableCell>
                      <TableCell>{entry.notes || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
