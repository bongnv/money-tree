import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { reportService } from '../../services/report.service';
import { ManualAssetSection } from './ManualAssetSection';
import { LineChart } from '../charts/LineChart';
import { formatCurrency } from '../../utils/currency.utils';

type ComparisonType = 'none' | 'month' | 'year';

export const BalanceSheet: React.FC = () => {
  const accounts = useAccountStore((state) => state.accounts);
  const manualAssets = useAssetStore((state) => state.manualAssets);
  const transactions = useTransactionStore((state) => state.transactions);

  // Use today as default date
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('none');

  // Assume USD for now - in future this should come from app settings
  const currencyId = 'usd';

  // Calculate balance sheet for selected date
  const balanceSheet = useMemo(
    () => reportService.calculateBalanceSheet(accounts, manualAssets, transactions, selectedDate),
    [accounts, manualAssets, transactions, selectedDate]
  );

  // Calculate comparison data
  const comparison = useMemo(() => {
    if (comparisonType === 'month') {
      return reportService.calculateMonthOverMonthComparison(
        accounts,
        manualAssets,
        transactions,
        selectedDate
      );
    } else if (comparisonType === 'year') {
      return reportService.calculateYearOverYearComparison(
        accounts,
        manualAssets,
        transactions,
        selectedDate
      );
    }
    return null;
  }, [accounts, manualAssets, transactions, selectedDate, comparisonType]);

  // Calculate net worth trend for the past year
  const trendData = useMemo(() => {
    const endDate = new Date(selectedDate);
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);

    const trend = reportService.calculateNetWorthTrend(
      accounts,
      manualAssets,
      transactions,
      startDate.toISOString().split('T')[0],
      selectedDate,
      30 // Monthly data points
    );

    return trend.map((point) => ({
      name: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      'Net Worth': point.netWorth,
      Assets: point.assets,
      Liabilities: point.liabilities,
    }));
  }, [accounts, manualAssets, transactions, selectedDate]);

  const handleComparisonChange = (_event: React.MouseEvent<HTMLElement>, newValue: ComparisonType | null) => {
    if (newValue !== null) {
      setComparisonType(newValue);
    }
  };

  return (
    <Box>
      {/* Header with date selector and comparison options */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Balance Sheet
            </Typography>
            <TextField
              label="As of Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Comparison
            </Typography>
            <ToggleButtonGroup
              value={comparisonType}
              exclusive
              onChange={handleComparisonChange}
              aria-label="comparison type"
              fullWidth
            >
              <ToggleButton value="none" aria-label="no comparison">
                None
              </ToggleButton>
              <ToggleButton value="month" aria-label="month over month">
                Month-over-Month
              </ToggleButton>
              <ToggleButton value="year" aria-label="year over year">
                Year-over-Year
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Assets
              </Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(balanceSheet.totalAssets, currencyId)}
              </Typography>
              {comparison && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {comparison.current.totalAssets >= comparison.previous.totalAssets ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {formatCurrency(
                      comparison.current.totalAssets - comparison.previous.totalAssets,
                      currencyId
                    )}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Liabilities
              </Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(balanceSheet.totalLiabilities, currencyId)}
              </Typography>
              {comparison && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {comparison.current.totalLiabilities <= comparison.previous.totalLiabilities ? (
                    <TrendingDownIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingUpIcon color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {formatCurrency(
                      comparison.current.totalLiabilities - comparison.previous.totalLiabilities,
                      currencyId
                    )}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography gutterBottom>Net Worth</Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(balanceSheet.netWorth, currencyId)}
              </Typography>
              {comparison && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {comparison.change >= 0 ? (
                    <TrendingUpIcon fontSize="small" />
                  ) : (
                    <TrendingDownIcon fontSize="small" />
                  )}
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {formatCurrency(comparison.change, currencyId)} (
                    {comparison.changePercent.toFixed(1)}%)
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Net Worth Trend Chart */}
      {trendData.length > 1 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Net Worth Trend (Past 12 Months)
          </Typography>
          <LineChart
            data={trendData}
            lines={[
              { dataKey: 'Net Worth', name: 'Net Worth', color: '#2e7d32' },
              { dataKey: 'Assets', name: 'Assets', color: '#1976d2' },
              { dataKey: 'Liabilities', name: 'Liabilities', color: '#d32f2f' },
            ]}
            height={400}
            formatValue={(value) => formatCurrency(value, currencyId)}
          />
        </Paper>
      )}

      {/* Assets Section */}
      <ManualAssetSection title="Assets" groups={balanceSheet.assets} currencyId={currencyId} />

      <Divider sx={{ my: 4 }} />

      {/* Liabilities Section */}
      <ManualAssetSection
        title="Liabilities"
        groups={balanceSheet.liabilities}
        currencyId={currencyId}
      />

      {/* Net Worth Summary */}
      <Paper sx={{ p: 3, mt: 3, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h5">Net Worth</Typography>
            <Typography variant="caption">Total Assets - Total Liabilities</Typography>
          </Grid>
          <Grid item>
            <Typography variant="h3">{formatCurrency(balanceSheet.netWorth, currencyId)}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
