import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { ManualAssetSection } from './ManualAssetSection';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';
import { AssetValueHistoryDialog } from '../assets/AssetValueHistoryDialog';
import { LineChart } from '../common/charts/LineChart';
import { formatCurrency } from '../../utils/currency.utils';
import { FormDatePicker } from '../common/FormDatePicker';
import { CurrencyCode } from '../../types/enums';
import { useBalanceSheet } from '@/hooks/reports/useBalanceSheet';

type ComparisonType = 'none' | 'month' | 'year';

export const BalanceSheet: React.FC = () => {
  const [historyDialogAssetId, setHistoryDialogAssetId] = useState<string | null>(null);
  const [uiComparisonType, setUiComparisonType] = useState<ComparisonType>('none');

  const {
    balanceSheet,
    netWorthTrend,
    comparison,
    reportDate,
    setReportDate,
    setComparisonType: setHookComparisonType,
    conversionCurrency,
    setConversionCurrency,
    isLoadingBalanceSheet,
    manualAssets,
  } = useBalanceSheet();

  const handleComparisonChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: ComparisonType | null
  ) => {
    if (newValue !== null) {
      setUiComparisonType(newValue);
      if (newValue !== 'none') {
        setHookComparisonType(newValue);
      }
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

  // Transform netWorthTrend data for LineChart
  const chartData =
    netWorthTrend?.map((point) => ({
      name: point.date,
      'Net Worth': point.netWorth,
      Assets: point.assets,
      Liabilities: point.liabilities,
    })) || [];

  return (
    <Box>
      {/* Header with date selector and comparison options */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h5" gutterBottom>
              Balance Sheet
            </Typography>
            <FormDatePicker
              label="As of Date"
              value={reportDate}
              onChange={setReportDate}
              sx={{ mt: 0 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Comparison
            </Typography>
            <ToggleButtonGroup
              value={uiComparisonType}
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
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Display Currency
            </Typography>
            <FormControl fullWidth>
              <Select
                value={conversionCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
              >
                {DEFAULT_CURRENCIES.map((curr) => (
                  <MenuItem key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {!balanceSheet ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {isLoadingBalanceSheet
              ? 'Loading balance sheet...'
              : 'No data available for selected date'}
          </Typography>
        </Paper>
      ) : (
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
                  {uiComparisonType !== 'none' && comparison && (
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
                  {uiComparisonType !== 'none' && comparison && (
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
                  {uiComparisonType !== 'none' && comparison && (
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
          {chartData.length > 1 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Net Worth Trend (Past 12 Months)
              </Typography>
              <LineChart
                data={chartData}
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
      )}

      {/* Asset Value History Dialog */}
      <AssetValueHistoryDialog
        open={historyDialogAssetId !== null}
        asset={manualAssets?.find((asset) => asset.id === historyDialogAssetId) || null}
        onClose={handleCloseHistoryDialog}
      />
    </Box>
  );
};
