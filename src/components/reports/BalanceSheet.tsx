import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type { BalanceSheetData } from '../../services/report.service';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useAssets } from '../../hooks/queries/useAssets';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useBaseCurrency } from '../../hooks/queries';
import { useReportService } from '../../contexts/ServiceProviders';
import { ManualAssetSection } from './ManualAssetSection';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';
import { AssetValueHistoryDialog } from '../assets/AssetValueHistoryDialog';
import { LineChart } from '../common/charts/LineChart';
import { formatCurrency } from '../../utils/currency.utils';
import type { CurrencyCode } from '../../types/enums';

type ComparisonType = 'none' | 'month' | 'year';

export const BalanceSheet: React.FC = () => {
  const accounts = useAccounts();
  const manualAssets = useAssets();
  const transactions = useTransactions();
  const baseCurrency = useBaseCurrency();
  const reportService = useReportService();

  // Use today as default date
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('none');
  const [historyDialogAssetId, setHistoryDialogAssetId] = useState<string | null>(null);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(baseCurrency);

  // Update conversion currency when base currency changes from DB
  useEffect(() => {
    setConversionCurrency(baseCurrency);
  }, [baseCurrency]);

  // Calculate balance sheet for selected date with currency conversion
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData>({
    assets: [],
    liabilities: [],
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
  });

  useEffect(() => {
    if (!accounts || !manualAssets || !transactions) return;

    const calculateBalanceSheet = async () => {
      const data = await reportService.calculateBalanceSheet(
        accounts,
        manualAssets,
        transactions,
        selectedDate,
        conversionCurrency
      );
      setBalanceSheet(data);
    };

    calculateBalanceSheet();
  }, [accounts, manualAssets, transactions, selectedDate, conversionCurrency]);

  // Calculate comparison data
  const [comparison, setComparison] = useState<{
    current: BalanceSheetData;
    previous: BalanceSheetData;
    change: number;
    changePercent: number;
  } | null>(null);

  useEffect(() => {
    if (!accounts || !manualAssets || !transactions) return;

    const calculateComparison = async () => {
      if (comparisonType === 'month') {
        const data = await reportService.calculateMonthOverMonthComparison(
          accounts,
          manualAssets,
          transactions,
          selectedDate,
          conversionCurrency
        );
        setComparison(data);
      } else if (comparisonType === 'year') {
        const data = await reportService.calculateYearOverYearComparison(
          accounts,
          manualAssets,
          transactions,
          selectedDate,
          conversionCurrency
        );
        setComparison(data);
      } else {
        setComparison(null);
      }
    };

    calculateComparison();
  }, [accounts, manualAssets, transactions, selectedDate, comparisonType, conversionCurrency]);
  // effectiveGetRateForMonth is stable from Zustand store

  // Calculate net worth trend for the past year
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    if (!accounts || !manualAssets || !transactions) return;

    const calculateTrend = async () => {
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

      const trend = await reportService.calculateNetWorthTrend(
        accounts,
        manualAssets,
        transactions,
        formatLocalDate(startDate),
        selectedDate,
        30, // Monthly data points
        conversionCurrency
      );

      setTrendData(
        trend.map((point) => ({
          name: new Date(point.date).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          'Net Worth': point.netWorth,
          Assets: point.assets,
          Liabilities: point.liabilities,
        }))
      );
    };

    calculateTrend();
  }, [accounts, manualAssets, transactions, selectedDate, conversionCurrency]);

  const handleComparisonChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: ComparisonType | null
  ) => {
    if (newValue !== null) {
      setComparisonType(newValue);
    }
  };

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setConversionCurrency(newCurrency);
  };

  const handleManageHistory = (assetId: string) => {
    setHistoryDialogAssetId(assetId);
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogAssetId(null);
  };

  const selectedAsset = manualAssets?.find((asset) => asset.id === historyDialogAssetId);

  return (
    <Box>
      {/* Header with date selector and comparison options */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
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
          <Grid size={{ xs: 12, md: 4 }}>
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
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Display Currency</InputLabel>
              <Select
                value={conversionCurrency}
                label="Display Currency"
                onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
              >
                {DEFAULT_CURRENCIES.map((curr) => (
                  <MenuItem key={curr.code} value={curr.code}>
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

      {/* Summary Cards */}
      {
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Assets
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatCurrency(balanceSheet.totalAssets, conversionCurrency)}
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
                          conversionCurrency
                        )}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Liabilities
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatCurrency(balanceSheet.totalLiabilities, conversionCurrency)}
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
                          conversionCurrency
                        )}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography gutterBottom>Net Worth</Typography>
                  <Typography variant="h4" component="div">
                    {formatCurrency(balanceSheet.netWorth, conversionCurrency)}
                  </Typography>
                  {comparison && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {comparison.change >= 0 ? (
                        <TrendingUpIcon fontSize="small" />
                      ) : (
                        <TrendingDownIcon fontSize="small" />
                      )}
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        {formatCurrency(comparison.change, conversionCurrency)} (
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
                formatValue={(value) => formatCurrency(value, conversionCurrency)}
              />
            </Paper>
          )}

          {/* Assets Section */}
          <ManualAssetSection
            title="Assets"
            groups={balanceSheet.assets}
            currencyCode={conversionCurrency}
            onManageHistory={handleManageHistory}
          />

          <Divider sx={{ my: 4 }} />

          {/* Liabilities Section */}
          <ManualAssetSection
            title="Liabilities"
            groups={balanceSheet.liabilities}
            currencyCode={conversionCurrency}
            onManageHistory={handleManageHistory}
          />

          {/* Net Worth Summary */}
          <Paper
            sx={{ p: 3, mt: 3, backgroundColor: 'primary.main', color: 'primary.contrastText' }}
          >
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid>
                <Typography variant="h5">Net Worth</Typography>
                <Typography variant="caption">Total Assets - Total Liabilities</Typography>
              </Grid>
              <Grid>
                <Typography variant="h3">
                  {formatCurrency(balanceSheet.netWorth, conversionCurrency)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </>
      }

      {/* Asset Value History Dialog */}
      <AssetValueHistoryDialog
        open={historyDialogAssetId !== null}
        asset={selectedAsset || null}
        onClose={handleCloseHistoryDialog}
      />
    </Box>
  );
};
