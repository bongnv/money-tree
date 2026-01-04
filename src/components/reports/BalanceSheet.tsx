import React, { useState, useMemo, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { reportService } from '../../services/report.service';
import { ManualAssetSection } from './ManualAssetSection';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';
import { AssetValueHistoryDialog } from '../assets/AssetValueHistoryDialog';
import { LineChart } from '../charts/LineChart';
import { formatCurrency } from '../../utils/currency.utils';

type ComparisonType = 'none' | 'month' | 'year';

export const BalanceSheet: React.FC = () => {
  const accounts = useAccountStore((state) => state.accounts);
  const manualAssets = useAssetStore((state) => state.manualAssets);
  const transactions = useTransactionStore((state) => state.transactions);
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const getRateForMonth = useExchangeRateStore((state) => state.getRateForMonth);
  const fetchRateIfMissing = useExchangeRateStore((state) => state.fetchRateIfMissing);

  // Use today as default date
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('none');
  const [historyDialogAssetId, setHistoryDialogAssetId] = useState<string | null>(null);
  const [conversionCurrency, setConversionCurrency] = useState<string>(baseCurrency);
  const [loadingRates, setLoadingRates] = useState<boolean>(false);

  // Use the selected currency for display
  const currencyId = conversionCurrency;

  // Always apply currency conversion
  const effectiveBaseCurrency = conversionCurrency;
  const effectiveGetRateForMonth = getRateForMonth;

  // Automatically fetch missing exchange rates in background for all historical months
  useEffect(() => {
    const fetchRates = async () => {
      setLoadingRates(true);

      // Get unique currencies from accounts and manual assets
      const currencies = new Set<string>();
      accounts.forEach((account) => {
        if (account.currencyId && account.currencyId !== conversionCurrency) {
          currencies.add(account.currencyId);
        }
      });
      manualAssets.forEach((asset) => {
        if (asset.currencyId && asset.currencyId !== conversionCurrency) {
          currencies.add(asset.currencyId);
        }
      });

      if (currencies.size === 0) {
        setLoadingRates(false);
        return;
      }

      // Get months for trend data (past 12 months + selected month)
      const months = new Set<string>();
      const [year, month, day] = selectedDate.split('-').map(Number);
      const currentDate = new Date(year, month - 1, day);
      const oneYearAgo = new Date(currentDate);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Add all months in the trend
      let tempDate = new Date(oneYearAgo);
      while (tempDate <= currentDate) {
        const monthStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthStr);
        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      // Fetch rates for all currency-month combinations
      const fetchPromises: Promise<number | null>[] = [];
      currencies.forEach((currency) => {
        months.forEach((month) => {
          fetchPromises.push(fetchRateIfMissing(month, currency, conversionCurrency));
        });
      });

      // Wait for all rates to be fetched or attempted
      await Promise.allSettled(fetchPromises);
      setLoadingRates(false);
    };

    fetchRates();
    // Only re-fetch when currency or date changes, not when accounts/assets arrays change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversionCurrency, selectedDate, fetchRateIfMissing]);

  // Calculate balance sheet for selected date with currency conversion
  const balanceSheet = useMemo(
    () =>
      reportService.calculateBalanceSheet(
        accounts,
        manualAssets,
        transactions,
        selectedDate,
        effectiveBaseCurrency,
        effectiveGetRateForMonth
      ),
    [
      accounts,
      manualAssets,
      transactions,
      selectedDate,
      effectiveBaseCurrency,
      effectiveGetRateForMonth,
    ]
  );

  // Calculate comparison data
  const comparison = useMemo(() => {
    if (comparisonType === 'month') {
      return reportService.calculateMonthOverMonthComparison(
        accounts,
        manualAssets,
        transactions,
        selectedDate,
        effectiveBaseCurrency,
        effectiveGetRateForMonth
      );
    } else if (comparisonType === 'year') {
      return reportService.calculateYearOverYearComparison(
        accounts,
        manualAssets,
        transactions,
        selectedDate,
        effectiveBaseCurrency,
        effectiveGetRateForMonth
      );
    }
    return null;
  }, [
    accounts,
    manualAssets,
    transactions,
    selectedDate,
    comparisonType,
    effectiveBaseCurrency,
    effectiveGetRateForMonth,
  ]);

  // Calculate net worth trend for the past year
  const trendData = useMemo(() => {
    // Parse date components to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const endDate = new Date(year, month - 1, day);
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);

    // Format dates as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const trend = reportService.calculateNetWorthTrend(
      accounts,
      manualAssets,
      transactions,
      formatLocalDate(startDate),
      selectedDate,
      30, // Monthly data points
      effectiveBaseCurrency,
      effectiveGetRateForMonth
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

  const handleComparisonChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: ComparisonType | null
  ) => {
    if (newValue !== null) {
      setComparisonType(newValue);
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setConversionCurrency(newCurrency);
  };

  const handleManageHistory = (assetId: string) => {
    setHistoryDialogAssetId(assetId);
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogAssetId(null);
  };

  const selectedAsset = manualAssets.find((asset) => asset.id === historyDialogAssetId);

  return (
    <Box>
      {/* Header with date selector and comparison options */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
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
                M/M
              </ToggleButton>
              <ToggleButton value="year" aria-label="year over year">
                Y/Y
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Display Currency</InputLabel>
              <Select
                value={conversionCurrency}
                label="Display Currency"
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                {DEFAULT_CURRENCIES.map((curr) => (
                  <MenuItem key={curr.id} value={curr.id}>
                    {curr.code} - {curr.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Converting all amounts to {conversionCurrency.toUpperCase()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading indicator for exchange rates */}
      {loadingRates && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, mb: 3 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading exchange rates...
          </Typography>
        </Box>
      )}

      {/* Summary Cards */}
      {!loadingRates && (
        <>
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
                      {comparison.current.totalLiabilities <=
                      comparison.previous.totalLiabilities ? (
                        <TrendingDownIcon color="success" fontSize="small" />
                      ) : (
                        <TrendingUpIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        {formatCurrency(
                          comparison.current.totalLiabilities -
                            comparison.previous.totalLiabilities,
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
          <ManualAssetSection
            title="Assets"
            groups={balanceSheet.assets}
            currencyId={currencyId}
            onManageHistory={handleManageHistory}
          />

          <Divider sx={{ my: 4 }} />

          {/* Liabilities Section */}
          <ManualAssetSection
            title="Liabilities"
            groups={balanceSheet.liabilities}
            currencyId={currencyId}
            onManageHistory={handleManageHistory}
          />

          {/* Net Worth Summary */}
          <Paper
            sx={{ p: 3, mt: 3, backgroundColor: 'primary.main', color: 'primary.contrastText' }}
          >
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <Typography variant="h5">Net Worth</Typography>
                <Typography variant="caption">Total Assets - Total Liabilities</Typography>
              </Grid>
              <Grid item>
                <Typography variant="h3">
                  {formatCurrency(balanceSheet.netWorth, currencyId)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}

      {/* Asset Value History Dialog */}
      <AssetValueHistoryDialog
        open={historyDialogAssetId !== null}
        asset={selectedAsset || null}
        onClose={handleCloseHistoryDialog}
      />
    </Box>
  );
};
