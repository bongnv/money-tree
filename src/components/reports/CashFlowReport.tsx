import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { categoryService } from '../../services/category.service';
import { transactionTypeService } from '../../services/transactionType.service';
import { accountService } from '../../services/account.service';
import { transactionService } from '../../services/transaction.service';
import { syncMetadataService } from '../../services/syncMetadata.service';
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
import { useReportService, useCalculationService } from '../../contexts/ServiceProviders';
import { LineChart } from '../common/charts/LineChart';
import { PieChart } from '../common/charts/PieChart';
import { PeriodSelector } from '../common/PeriodSelector';
import { CategoryFilter } from '../common/CategoryFilter';
import { formatCurrency } from '../../utils/currency.utils';
import { getTodayDate } from '../../utils/date.utils';
import { hasTransactionTypesInGroup } from '../../utils/report.utils';
import { CHART_COLORS } from '../../theme';
import { CurrencyCode } from '../../types/enums';
import { Group } from '../../types/enums';
import type { CashFlowData } from '../../services/report.service';
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
  const transactions = useLiveQuery(() => transactionService.getActive()) ?? [];
  const transactionTypes = useLiveQuery(() => transactionTypeService.getActive()) ?? [];
  const categories = useLiveQuery(() => categoryService.getActive()) ?? [];
  const accounts = useLiveQuery(() => accountService.getActive()) ?? [];
  const baseCurrency =
    useLiveQuery(() => syncMetadataService.getBaseCurrency()) || CurrencyCode.USD;
  const reportService = useReportService();
  const calculationService = useCalculationService();

  // Date range state - default to Year to Date
  const today = getTodayDate();
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const [startDate, setStartDate] = useState<string>(yearStart);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(baseCurrency);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'period' | 'cumulative'>('period');

  // Update conversion currency when base currency changes from DB
  useEffect(() => {
    setConversionCurrency(baseCurrency);
  }, [baseCurrency]);

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  // Calculate cash flow for selected period
  const filteredTransactions = useMemo(() => {
    if (!transactions || !transactionTypes) return [];
    if (selectedCategories.length === 0) {
      return transactions;
    }
    return transactions.filter((tx) => {
      const txType = transactionTypes.find((tt) => tt.id === tx.transactionTypeId);
      return txType && selectedCategories.includes(txType.categoryId);
    });
  }, [transactions, transactionTypes, selectedCategories]);

  const [cashFlow, setCashFlow] = useState<CashFlowData>({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    income: [],
    expenses: [],
  });

  useEffect(() => {
    if (!filteredTransactions || !transactionTypes || !categories || !accounts) return;

    const calculateCashFlow = async () => {
      const data = await reportService.calculateCashFlow(
        filteredTransactions,
        transactionTypes,
        categories,
        startDate,
        endDate,
        accounts,
        conversionCurrency
      );
      setCashFlow(data);
    };

    calculateCashFlow();
  }, [
    filteredTransactions,
    transactionTypes,
    categories,
    accounts,
    startDate,
    endDate,
    conversionCurrency,
    reportService,
  ]);

  // Calculate trend data
  const [trendData, setTrendData] = useState<
    import('../../services/report.service').CashFlowTrendPoint[]
  >([]);

  useEffect(() => {
    if (!filteredTransactions || !transactionTypes || !categories || !accounts) return;

    const calculateTrend = async () => {
      // Determine interval based on date range duration
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const intervalDays = daysDiff > 180 ? 30 : daysDiff > 60 ? 7 : 1;

      const trend = await reportService.calculateCashFlowTrend(
        filteredTransactions,
        transactionTypes,
        categories,
        startDate,
        endDate,
        intervalDays,
        accounts,
        conversionCurrency
      );
      setTrendData(trend);
    };

    calculateTrend();
  }, [
    filteredTransactions,
    transactionTypes,
    categories,
    accounts,
    startDate,
    endDate,
    conversionCurrency,
    reportService,
  ]);

  // Calculate cumulative data
  const cumulativeData = useMemo(() => {
    let cumulativeIncome = 0;
    let cumulativeExpenses = 0;
    let cumulativeNet = 0;

    return trendData.map(
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
  }, [trendData]);

  // Prepare chart data based on view mode
  const chartData = useMemo(() => {
    const dataSource = viewMode === 'cumulative' ? cumulativeData : trendData;
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
  }, [trendData, cumulativeData, viewMode]);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setConversionCurrency(newCurrency);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
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
      setSelectedCategories([categoryId]);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
  };

  // Prepare pie chart and table data - derive from cashFlow when no filter
  // When filter is applied, calculate by transaction type
  const hasFilter = selectedCategories.length > 0;

  // For no filter case - use cashFlow data directly
  const unfiltered = useMemo(() => {
    if (hasFilter) return null;
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
  }, [hasFilter, cashFlow.income, cashFlow.expenses]);

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

    if (!filteredTransactions || !transactionTypes || !accounts) return;

    const calculateFiltered = async () => {
      const { incomeByType, expenseByType } =
        await calculationService.calculateTransactionTypeGrouping(
          filteredTransactions,
          transactionTypes,
          accounts,
          conversionCurrency
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
  }, [hasFilter, selectedCategories, conversionCurrency, startDate, endDate]);
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
  const hasIncomeTypes = useMemo(
    () => hasTransactionTypesInGroup(selectedCategories, transactionTypes || [], Group.INCOME),
    [selectedCategories, transactionTypes]
  );

  const hasExpenseTypes = useMemo(
    () => hasTransactionTypesInGroup(selectedCategories, transactionTypes || [], Group.EXPENSE),
    [selectedCategories, transactionTypes]
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
              selectedCategories={selectedCategories}
              onChange={handleCategoryChange}
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
      {trendData.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
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
                        onClick={() => handleCategoryClick(item.categoryId, item.isTransactionType)}
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
                        onClick={() => handleCategoryClick(item.categoryId, item.isTransactionType)}
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
    </Box>
  );
};
