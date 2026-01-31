import React, { useState, useEffect, useMemo } from 'react';
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
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useCashFlowReport } from '@/hooks/reports/useCashFlowReport';
import { useTransactionTypes } from '@/hooks/useTransactionTypes';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useActiveAccounts } from '@/hooks/useAccounts';
import { useCalculationService } from '@/hooks/useServices';
import { useEnsureExchangeRates } from '@/hooks/useExchangeRates';
import { LineChart } from '../common/charts/LineChart';
import { PieChart } from '../common/charts/PieChart';
import { PeriodSelector } from '../common/PeriodSelector';
import { CategoryFilter } from '../common/CategoryFilter';
import { formatCurrency } from '../../utils/currency.utils';
import { hasTransactionTypesInGroup } from '../../utils/report.utils';
import { CHART_COLORS } from '../../theme';
import { CurrencyCode } from '../../types/enums';
import { Group } from '../../types/enums';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';

/**
 * Build chart lines for cash flow trend based on available income/expense types
 */
const buildCashFlowTrendLines = (hasIncomeTypes: boolean, hasExpenseTypes: boolean) => {
  const lines = [];
  if (hasIncomeTypes) {
    lines.push({ dataKey: 'Income', color: CHART_COLORS.simple.income, name: 'Income' });
  }
  if (hasExpenseTypes) {
    lines.push({ dataKey: 'Expenses', color: CHART_COLORS.simple.expense, name: 'Expenses' });
  }
  if (hasIncomeTypes && hasExpenseTypes) {
    lines.push({
      dataKey: 'Net Cash Flow',
      color: CHART_COLORS.simple.netCashFlow,
      name: 'Net Cash Flow',
    });
  }
  return lines;
};

export const CashFlowReport: React.FC = () => {
  const navigate = useNavigate();
  const allTransactions = useTransactions();
  const transactionTypes = useTransactionTypes();
  const categories = useCategories();
  const accounts = useActiveAccounts();
  const calculationService = useCalculationService();

  const {
    cashFlow,
    isLoadingCashFlow,
    cashFlowTrend,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    conversionCurrency,
    setConversionCurrency,
    filters,
    setFilter,
    applyFilters,
    resetFilters,
  } = useCashFlowReport();

  // UI state
  const [viewMode, setViewMode] = useState<'period' | 'cumulative'>('period');

  // Calculate filtered transactions for the pie charts
  const filteredTransactions = useMemo(() => {
    if (!allTransactions || !transactionTypes) return [];
    if (filters.categoryIds.length === 0) {
      return allTransactions;
    }
    return allTransactions.filter((tx) => {
      const txType = transactionTypes.find((tt) => tt.id === tx.transactionTypeId);
      return txType && filters.categoryIds.includes(txType.categoryId);
    });
  }, [allTransactions, transactionTypes, filters.categoryIds]);

  // Calculate months for filtered chart rate loading from actual transactions
  const months = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      // Fallback to date range if no transactions
      const monthsSet = new Set<string>();
      monthsSet.add(startDate.substring(0, 7));
      monthsSet.add(endDate.substring(0, 7));
      return Array.from(monthsSet);
    }

    // Extract unique months from actual filtered transactions
    const monthsSet = new Set<string>();
    filteredTransactions.forEach((tx) => {
      monthsSet.add(tx.date.substring(0, 7));
    });
    return Array.from(monthsSet);
  }, [filteredTransactions, startDate, endDate]);

  // Gather currencies for filtered chart
  const currencies = useMemo(() => {
    const set = new Set<CurrencyCode>();
    accounts?.forEach((acc) => {
      if (acc.currencyCode) set.add(acc.currencyCode);
    });
    set.add(conversionCurrency);
    return set;
  }, [accounts, conversionCurrency]);

  // Pre-load exchange rates for filtered charts
  const { ratesMap, isLoading: ratesLoading } = useEnsureExchangeRates(
    currencies,
    months,
    conversionCurrency
  );

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  // Calculate cumulative data
  const cumulativeData = React.useMemo(() => {
    if (!cashFlowTrend) return [];

    let cumulativeIncome = 0;
    let cumulativeExpenses = 0;
    let cumulativeNet = 0;

    return cashFlowTrend.map(
      (point: { date: string; income: number; expenses: number; netCashFlow: number }) => {
        cumulativeIncome += point.income;
        cumulativeExpenses += point.expenses;
        cumulativeNet += point.netCashFlow;

        return {
          date: point.date,
          income: cumulativeIncome,
          expenses: cumulativeExpenses,
          netCashFlow: cumulativeNet,
        };
      }
    );
  }, [cashFlowTrend]);

  // Prepare chart data based on view mode
  const chartData = React.useMemo(() => {
    const dataSource = viewMode === 'cumulative' ? cumulativeData : cashFlowTrend || [];
    return dataSource.map(
      (point: { date: string; income: number; expenses: number; netCashFlow: number }) => ({
        name: new Date(point.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        Income: point.income,
        Expenses: point.expenses,
        'Net Cash Flow': point.netCashFlow,
      })
    );
  }, [cashFlowTrend, cumulativeData, viewMode]);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setConversionCurrency(newCurrency);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const categoryIds = typeof value === 'string' ? value.split(',') : value;
    setFilter('categoryIds', categoryIds);
    applyFilters();
  };

  const handleCategoryClick = (categoryId: string, isTransactionType: boolean = false) => {
    if (isTransactionType) {
      // Navigate to transactions page for transaction type clicks
      const params = new URLSearchParams();
      params.set('transactionTypeId', categoryId);
      params.set('dateFrom', startDate);
      params.set('dateTo', endDate);
      navigate(`/transactions?${params.toString()}`);
    } else {
      // Filter on same page for category clicks
      setFilter('categoryIds', [categoryId]);
      applyFilters();
    }
  };

  const handleClearFilters = () => {
    resetFilters();
  };

  // Prepare pie chart and table data - derive from cashFlow when no filter
  // When filter is applied, calculate by transaction type
  const hasFilter = filters.categoryIds.length > 0;

  // For no filter case - use cashFlow data directly
  const unfiltered = React.useMemo(() => {
    if (hasFilter || !cashFlow) return null;
    return {
      incomePieData: cashFlow.income.map((cat) => ({
        name: cat.categoryName,
        value: cat.total,
      })),
      expensesPieData: cashFlow.expenses.map((cat) => ({
        name: cat.categoryName,
        value: cat.total,
      })),
      incomeDetailData: cashFlow.income.map((cat) => ({ ...cat, isTransactionType: false })),
      expenseDetailData: cashFlow.expenses.map((cat) => ({ ...cat, isTransactionType: false })),
      groupingLabel: 'Category',
    };
  }, [hasFilter, cashFlow]);

  // For filtered case - group by transaction type
  const [filteredChartData, setFilteredChartData] = useState<{
    incomePieData: { name: string; value: number }[];
    expensesPieData: { name: string; value: number }[];
    incomeDetailData: Array<{
      isTransactionType: boolean;
      categoryId: string;
      categoryName: string;
      total: number;
      transactionCount: number;
    }>;
    expenseDetailData: Array<{
      isTransactionType: boolean;
      categoryId: string;
      categoryName: string;
      total: number;
      transactionCount: number;
    }>;
    groupingLabel: string;
  } | null>(null);

  useEffect(() => {
    if (!hasFilter) {
      setFilteredChartData(null);
      return;
    }

    if (!filteredTransactions || !transactionTypes || !accounts || ratesLoading || !ratesMap)
      return;

    const calculateFiltered = () => {
      const { incomeByType, expenseByType } = calculationService.calculateTransactionTypeGrouping(
        filteredTransactions,
        transactionTypes,
        accounts,
        conversionCurrency,
        ratesMap
      );

      setFilteredChartData({
        incomePieData: Array.from(incomeByType.values()).map((item) => ({
          name: item.name,
          value: item.total,
        })),
        expensesPieData: Array.from(expenseByType.values()).map((item) => ({
          name: item.name,
          value: item.total,
        })),
        incomeDetailData: Array.from(incomeByType.entries()).map(([id, item]) => ({
          categoryId: id,
          categoryName: item.name,
          total: item.total,
          transactionCount: item.count,
          isTransactionType: true,
        })),
        expenseDetailData: Array.from(expenseByType.entries()).map(([id, item]) => ({
          categoryId: id,
          categoryName: item.name,
          total: item.total,
          transactionCount: item.count,
          isTransactionType: true,
        })),
        groupingLabel: 'Transaction Type',
      });
    };

    calculateFiltered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasFilter,
    filters.categoryIds,
    conversionCurrency,
    startDate,
    endDate,
    ratesMap,
    ratesLoading,
  ]);
  // filteredTransactions, transactionTypes, and accounts are stable or captured in closure

  // Use the appropriate data source
  const chartTableData = hasFilter ? filteredChartData : unfiltered;
  const { incomePieData, expensesPieData, incomeDetailData, expenseDetailData, groupingLabel } =
    chartTableData || {
      incomePieData: [],
      expensesPieData: [],
      incomeDetailData: [],
      expenseDetailData: [],
      groupingLabel: 'Category',
    };

  // Determine which transaction types exist in filtered categories
  const hasIncomeTypes = React.useMemo(
    () => hasTransactionTypesInGroup(filters.categoryIds, transactionTypes || [], Group.INCOME),
    [filters.categoryIds, transactionTypes]
  );

  const hasExpenseTypes = React.useMemo(
    () => hasTransactionTypesInGroup(filters.categoryIds, transactionTypes || [], Group.EXPENSE),
    [filters.categoryIds, transactionTypes]
  );

  // Dynamically build chart lines based on what exists
  const trendChartLines = useMemo(
    () => buildCashFlowTrendLines(hasIncomeTypes, hasExpenseTypes),
    [hasIncomeTypes, hasExpenseTypes]
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Cash Flow Report
        </Typography>
      </Box>

      {/* Period Selection */}
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
                onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
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
              selectedCategories={filters.categoryIds}
              onChange={handleCategoryChange}
              onClear={handleClearFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 1 }}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              disabled={filters.categoryIds.length === 0}
              fullWidth
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {isLoadingCashFlow || !cashFlow ? (
        <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
          <Typography color="text.secondary">Loading cash flow data...</Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Income
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="h5">
                      {formatCurrency(cashFlow.totalIncome, conversionCurrency)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDownIcon color="error" />
                    <Typography variant="h5">
                      {formatCurrency(cashFlow.totalExpenses, conversionCurrency)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Net Cash Flow
                  </Typography>
                  <Typography
                    variant="h5"
                    color={cashFlow.netCashFlow >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(cashFlow.netCashFlow, conversionCurrency)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Trend Chart */}
          {cashFlowTrend && cashFlowTrend.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Cash Flow Trend</Typography>
                <ToggleButtonGroup
                  size="small"
                  value={viewMode}
                  exclusive
                  onChange={(_event, newMode) => {
                    if (newMode !== null) {
                      setViewMode(newMode);
                    }
                  }}
                  aria-label="chart view mode"
                >
                  <ToggleButton value="period" aria-label="period view">
                    Period
                  </ToggleButton>
                  <ToggleButton value="cumulative" aria-label="cumulative view">
                    Cumulative
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <LineChart
                data={chartData}
                lines={trendChartLines}
                height={300}
                formatValue={(value: number) => formatCurrency(value, conversionCurrency)}
              />
            </Paper>
          )}

          {/* Category Breakdown Charts */}
          <Grid
            container
            spacing={3}
            sx={{ mb: 3 }}
            justifyContent={
              incomePieData.length > 0 && expensesPieData.length > 0 ? 'flex-start' : 'center'
            }
          >
            {incomePieData.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Income by {groupingLabel}
                  </Typography>
                  <PieChart
                    data={incomePieData}
                    height={300}
                    formatter={(value) => formatCurrency(value, conversionCurrency)}
                  />
                </Paper>
              </Grid>
            )}
            {expensesPieData.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Expenses by {groupingLabel}
                  </Typography>
                  <PieChart
                    data={expensesPieData}
                    height={300}
                    formatter={(value) => formatCurrency(value, conversionCurrency)}
                  />
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Detailed Tables */}
          <Grid container spacing={3}>
            {hasIncomeTypes && (
              <Grid size={{ xs: 12, md: hasExpenseTypes ? 6 : 12 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Income Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{groupingLabel}</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {incomeDetailData.map((item) => (
                          <TableRow
                            key={item.categoryId}
                            onClick={() =>
                              handleCategoryClick(item.categoryId, item.isTransactionType)
                            }
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: 'action.hover' },
                            }}
                          >
                            <TableCell>{item.categoryName}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.total, conversionCurrency)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {incomeDetailData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} align="center">
                              No income transactions
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
            {hasExpenseTypes && (
              <Grid size={{ xs: 12, md: hasIncomeTypes ? 6 : 12 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Expense Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{groupingLabel}</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expenseDetailData.map((item) => (
                          <TableRow
                            key={item.categoryId}
                            onClick={() =>
                              handleCategoryClick(item.categoryId, item.isTransactionType)
                            }
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: 'action.hover' },
                            }}
                          >
                            <TableCell>{item.categoryName}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.total, conversionCurrency)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {expenseDetailData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} align="center">
                              No expense transactions
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
};
