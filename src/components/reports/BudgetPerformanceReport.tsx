import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  LinearProgress,
  Chip,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useBudgetPerformance } from '@/hooks/reports/useBudgetPerformance';
import { PeriodSelector } from '../common/PeriodSelector';
import { CategoryFilter } from '../common/CategoryFilter';
import { LineChart } from '../common/charts/LineChart';
import { CHART_COLORS } from '../../theme';
import { formatCurrency } from '../../utils/currency.utils';
import { CurrencyCode } from '../../types/enums';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';
import { useCategories } from '../../hooks/useCategories';

export const BudgetPerformanceReport: React.FC = () => {
  const navigate = useNavigate();
  const categories = useCategories();

  const {
    displayPerformance,
    groupedItems,
    trendData,
    startDate,
    endDate,
    setDateRange,
    conversionCurrency,
    setConversionCurrency,
    selectedCategories,
    handleCategoryChange,
    handleClearFilters,
    handleItemClick,
  } = useBudgetPerformance();

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setDateRange(range.startDate, range.endDate);
  };

  const handleCategoryFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    handleCategoryChange(typeof value === 'string' ? value.split(',') : value);
  };

  // Determine health score color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />;
    return <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />;
  };

  const onItemClick = (itemId: string, isCategory: boolean) => {
    const result = handleItemClick(itemId, isCategory);
    if (!isCategory) {
      // Navigate to transactions page for transaction type clicks
      const params = new URLSearchParams();
      params.set('transactionTypeId', result.itemId);
      params.set('dateFrom', result.startDate);
      params.set('dateTo', result.endDate);
      navigate(`/transactions?${params.toString()}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Budget Performance Report
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <PeriodSelector
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={conversionCurrency}
                label="Currency"
                onChange={(e) => setConversionCurrency(e.target.value as CurrencyCode)}
              >
                {DEFAULT_CURRENCIES.map((curr) => (
                  <MenuItem key={curr.code} value={curr.code}>
                    {curr.code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4.5 }}>
            <CategoryFilter
              categories={categories || []}
              selectedCategories={selectedCategories}
              onChange={handleCategoryFilterChange}
              onClear={handleClearFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 1 }}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              disabled={selectedCategories.length === 0}
              fullWidth
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Budgeted (Expenses)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDownIcon color="primary" />
                <Typography variant="h5">
                  {formatCurrency(displayPerformance.totalBudgetedExpenses, conversionCurrency)}
                </Typography>
              </Box>
              {displayPerformance.totalBudgetedIncome > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Target (Income)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="body1">
                      {formatCurrency(displayPerformance.totalBudgetedIncome, conversionCurrency)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Actual (Expenses)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDownIcon
                  color={
                    displayPerformance.totalActualExpenses <=
                    displayPerformance.totalBudgetedExpenses
                      ? 'success'
                      : 'error'
                  }
                />
                <Typography variant="h5">
                  {formatCurrency(displayPerformance.totalActualExpenses, conversionCurrency)}
                </Typography>
              </Box>
              {displayPerformance.totalBudgetedIncome > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Actual (Income)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon
                      color={
                        displayPerformance.totalActualIncome >=
                        displayPerformance.totalBudgetedIncome
                          ? 'success'
                          : 'warning'
                      }
                    />
                    <Typography variant="body1">
                      {formatCurrency(displayPerformance.totalActualIncome, conversionCurrency)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Overall Health Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getHealthIcon(displayPerformance.overallHealthScore)}
                <Typography
                  variant="h5"
                  color={getHealthColor(displayPerformance.overallHealthScore)}
                >
                  {displayPerformance.overallHealthScore.toFixed(0)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {displayPerformance.overallHealthScore >= 80
                  ? 'On Track'
                  : displayPerformance.overallHealthScore >= 60
                    ? 'Needs Attention'
                    : 'Review Required'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget vs Actual Trend Chart */}
      {trendData.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Budget vs Actual Trend
          </Typography>
          <LineChart
            data={trendData.map((point) => ({
              name: new Date(point.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              'Income Target': point.budgetedIncome,
              'Income Actual': point.actualIncome,
              'Expense Budgeted': point.budgeted,
              'Expense Actual': point.actual,
            }))}
            lines={[
              {
                dataKey: 'Income Target',
                name: 'Income Target',
                color: CHART_COLORS.income.target,
                strokeDasharray: '5 5',
              },
              {
                dataKey: 'Income Actual',
                name: 'Income Actual',
                color: CHART_COLORS.income.actual,
              },
              {
                dataKey: 'Expense Budgeted',
                name: 'Expense Budgeted',
                color: CHART_COLORS.expense.budgeted,
                strokeDasharray: '5 5',
              },
              {
                dataKey: 'Expense Actual',
                name: 'Expense Actual',
                color: CHART_COLORS.expense.actual,
              },
            ]}
            height={400}
            formatValue={(value) => formatCurrency(value, conversionCurrency)}
          />
        </Paper>
      )}

      {/* Budget Performance Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Budget Performance Details
        </Typography>
        {displayPerformance.items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No budgets found for this period. Create budgets in the Budgets section.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    {selectedCategories.length > 0 ? 'Transaction Type' : 'Category'}
                  </TableCell>
                  <TableCell align="right">Budgeted/Target</TableCell>
                  <TableCell align="right">Actual</TableCell>
                  <TableCell align="right">Remaining</TableCell>
                  <TableCell align="right">% Used</TableCell>
                  <TableCell>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedItems.map((item) => {
                  const progressColor = item.isIncome
                    ? item.percentUsed >= 100
                      ? 'success'
                      : item.percentUsed >= 80
                        ? 'warning'
                        : 'error'
                    : item.percentUsed <= 80
                      ? 'success'
                      : item.percentUsed <= 100
                        ? 'warning'
                        : 'error';

                  return (
                    <TableRow
                      key={item.isCategory ? item.categoryId : item.transactionTypeId}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() =>
                        onItemClick(
                          item.isCategory ? item.categoryId : item.transactionTypeId!,
                          item.isCategory
                        )
                      }
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.isCategory ? item.categoryName : item.transactionTypeName}
                          {item.isIncome && <Chip label="Income" size="small" color="success" />}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.budgetedAmount, conversionCurrency)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.actualAmount, conversionCurrency)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={
                            item.remaining >= 0
                              ? item.isIncome
                                ? 'error.main'
                                : 'success.main'
                              : item.isIncome
                                ? 'success.main'
                                : 'error.main'
                          }
                        >
                          {formatCurrency(Math.abs(item.remaining), conversionCurrency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.percentUsed.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(item.percentUsed, 100)}
                            color={progressColor}
                            sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};
