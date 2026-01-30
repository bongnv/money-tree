import React, { useState, useMemo, useEffect } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useReportService } from '../../contexts/ServiceProviders';
import type { BudgetPerformanceData } from '../../services/report.service';
import { LineChart } from '../common/charts/LineChart';
import { PeriodSelector } from '../common/PeriodSelector';
import { CategoryFilter } from '../common/CategoryFilter';
import { formatCurrency } from '../../utils/currency.utils';
import { getTodayDate } from '../../utils/date.utils';
import { hasTransactionTypesInGroup } from '../../utils/report.utils';
import { CHART_COLORS } from '../../theme';
import { CurrencyCode } from '../../types/enums';
import { Group } from '../../types/enums';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';
import { useActiveAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useTransactionTypes } from '../../hooks/useTransactionTypes';
import { useBudgets } from '../../hooks/useBudgets';
import { useBaseCurrency } from '../../hooks/useSyncMetadata';

/**
 * Build chart lines for budget performance trend based on available income/expense types
 */
const buildBudgetTrendLines = (hasIncomeTypes: boolean, hasExpenseTypes: boolean) => {
  const lines = [];
  if (hasIncomeTypes) {
    lines.push(
      {
        dataKey: 'Income Target',
        color: CHART_COLORS.income.target,
        name: 'Income Target',
      },
      {
        dataKey: 'Income Actual',
        color: CHART_COLORS.income.actual,
        name: 'Income Actual',
        strokeDasharray: '5 5',
      }
    );
  }
  if (hasExpenseTypes) {
    lines.push(
      {
        dataKey: 'Expense Budgeted',
        color: CHART_COLORS.expense.budgeted,
        name: 'Expense Budgeted',
      },
      {
        dataKey: 'Expense Actual',
        color: CHART_COLORS.expense.actual,
        name: 'Expense Actual',
        strokeDasharray: '5 5',
      }
    );
  }
  return lines;
};

export const BudgetPerformanceReport: React.FC = () => {
  const navigate = useNavigate();
  const budgets = useBudgets();
  const transactions = useTransactions();
  const transactionTypes = useTransactionTypes();
  const categories = useCategories();
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();
  const reportService = useReportService();

  // Date range state - default to Year to Date
  const today = getTodayDate();
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const [startDate, setStartDate] = useState<string>(yearStart);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(baseCurrency);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'period' | 'cumulative'>('cumulative');

  // Update conversion currency when base currency changes from DB
  useEffect(() => {
    setConversionCurrency(baseCurrency);
  }, [baseCurrency]);

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
  };

  // Filter transactions and budgets by selected categories
  const { filteredTransactions, filteredBudgets } = useMemo(() => {
    if (!transactions || !budgets || !transactionTypes) {
      return { filteredTransactions: [], filteredBudgets: [] };
    }

    if (selectedCategories.length === 0) {
      return { filteredTransactions: transactions, filteredBudgets: budgets };
    }

    const filteredTx = transactions.filter((tx) => {
      const txType = transactionTypes.find((tt) => tt.id === tx.transactionTypeId);
      return txType && selectedCategories.includes(txType.categoryId);
    });

    const filteredBdg = budgets.filter((budget) => {
      const txType = transactionTypes.find((tt) => tt.id === budget.transactionTypeId);
      return txType && selectedCategories.includes(txType.categoryId);
    });

    return { filteredTransactions: filteredTx, filteredBudgets: filteredBdg };
  }, [transactions, budgets, transactionTypes, selectedCategories]);

  // Calculate budget performance
  const [performance, setPerformance] = useState<BudgetPerformanceData>({
    items: [],
    totalBudgetedIncome: 0,
    totalActualIncome: 0,
    totalRemainingIncome: 0,
    totalBudgetedExpenses: 0,
    totalActualExpenses: 0,
    totalRemainingExpenses: 0,
    overallHealthScore: 100,
  });

  useEffect(() => {
    if (!filteredBudgets || !filteredTransactions || !transactionTypes || !categories || !accounts)
      return;

    const calculatePerformance = async () => {
      const data = await reportService.calculateBudgetPerformance(
        filteredBudgets,
        filteredTransactions,
        transactionTypes,
        categories,
        startDate,
        endDate,
        accounts,
        conversionCurrency
      );
      setPerformance(data);
    };

    calculatePerformance();
  }, [
    filteredBudgets,
    filteredTransactions,
    transactionTypes,
    categories,
    startDate,
    endDate,
    accounts,
    conversionCurrency,
    reportService,
  ]);

  // Calculate trend data
  const [rawTrendData, setRawTrendData] = useState<
    import('../../services/report.service').BudgetTrendPoint[]
  >([]);

  useEffect(() => {
    if (!filteredBudgets || !filteredTransactions || !transactionTypes || !categories || !accounts)
      return;

    const calculateTrend = async () => {
      // Determine interval based on date range duration
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const intervalDays = daysDiff > 180 ? 30 : daysDiff > 60 ? 7 : 1;

      const trend = await reportService.calculateBudgetTrend(
        filteredBudgets,
        filteredTransactions,
        transactionTypes,
        categories,
        startDate,
        endDate,
        intervalDays,
        accounts,
        conversionCurrency
      );

      setRawTrendData(trend);
    };

    calculateTrend();
  }, [
    filteredBudgets,
    filteredTransactions,
    transactionTypes,
    categories,
    startDate,
    endDate,
    reportService,
    accounts,
    conversionCurrency,
  ]);

  // Calculate period trend data (differences between consecutive cumulative points)
  const periodTrendData = useMemo(() => {
    if (rawTrendData.length === 0) return [];

    return rawTrendData.map((point, index) => {
      if (index === 0) {
        // First point is the period value itself
        return {
          date: point.date,
          budgetedIncome: point.budgetedIncome,
          actualIncome: point.actualIncome,
          budgeted: point.budgeted,
          actual: point.actual,
        };
      }

      // Calculate difference from previous cumulative point
      const prevPoint = rawTrendData[index - 1];
      return {
        date: point.date,
        budgetedIncome: point.budgetedIncome - prevPoint.budgetedIncome,
        actualIncome: point.actualIncome - prevPoint.actualIncome,
        budgeted: point.budgeted - prevPoint.budgeted,
        actual: point.actual - prevPoint.actual,
      };
    });
  }, [rawTrendData]);

  // Prepare chart data based on view mode
  const trendData = useMemo(() => {
    // rawTrendData from service is already cumulative
    const dataSource = viewMode === 'cumulative' ? rawTrendData : periodTrendData;
    return dataSource.map((point) => ({
      name: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      'Income Target': point.budgetedIncome,
      'Income Actual': point.actualIncome,
      'Expense Budgeted': point.budgeted,
      'Expense Actual': point.actual,
    }));
  }, [rawTrendData, periodTrendData, viewMode]);

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

  const handleItemClick = (itemId: string, isCategory: boolean) => {
    if (isCategory) {
      // Filter on same page for category clicks
      setSelectedCategories([itemId]);
    } else {
      // Navigate to transactions page for transaction type clicks
      const params = new URLSearchParams();
      params.set('transactionTypeId', itemId);
      params.set('dateFrom', startDate);
      params.set('dateTo', endDate);
      navigate(`/transactions?${params.toString()}`);
    }
  };

  // Group items by category for display
  const groupedItems: Array<
    | {
        categoryId: string;
        categoryName: string;
        isCategory: true;
        budgetedAmount: number;
        actualAmount: number;
        remaining: number;
        percentUsed: number;
        isIncome: boolean;
      }
    | {
        categoryId: string;
        categoryName: string;
        isCategory: false;
        transactionTypeId: string;
        transactionTypeName: string;
        budgetedAmount: number;
        actualAmount: number;
        remaining: number;
        percentUsed: number;
        isIncome: boolean;
      }
  > = useMemo(() => {
    if (selectedCategories.length > 0) {
      // When filtered, show individual transaction types
      return performance.items.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        isCategory: false as const,
        // Transaction type details
        transactionTypeId: item.transactionTypeId,
        transactionTypeName: item.transactionTypeName,
        budgetedAmount: item.budgetedAmount,
        actualAmount: item.actualAmount,
        remaining: item.remaining,
        percentUsed: item.percentUsed,
        isIncome: item.isIncome,
      }));
    }

    // When no filter, aggregate by category
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        budgetedAmount: number;
        actualAmount: number;
        isIncome: boolean;
      }
    >();

    performance.items.forEach((item) => {
      const existing = categoryMap.get(item.categoryId);
      if (existing) {
        existing.budgetedAmount += item.budgetedAmount;
        existing.actualAmount += item.actualAmount;
      } else {
        categoryMap.set(item.categoryId, {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          budgetedAmount: item.budgetedAmount,
          actualAmount: item.actualAmount,
          isIncome: item.isIncome,
        });
      }
    });

    return Array.from(categoryMap.values()).map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      isCategory: true as const,
      budgetedAmount: cat.budgetedAmount,
      actualAmount: cat.actualAmount,
      remaining: cat.budgetedAmount - cat.actualAmount,
      percentUsed: cat.budgetedAmount > 0 ? (cat.actualAmount / cat.budgetedAmount) * 100 : 0,
      isIncome: cat.isIncome,
    }));
  }, [performance.items, selectedCategories]);

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
    () => buildBudgetTrendLines(hasIncomeTypes, hasExpenseTypes),
    [hasIncomeTypes, hasExpenseTypes]
  );

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
                Total Budgeted (Expenses)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDownIcon color="primary" />
                <Typography variant="h5">
                  {formatCurrency(performance.totalBudgetedExpenses, conversionCurrency)}
                </Typography>
              </Box>
              {performance.totalBudgetedIncome > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Target (Income)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="body1">
                      {formatCurrency(performance.totalBudgetedIncome, conversionCurrency)}
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
                    performance.totalActualExpenses <= performance.totalBudgetedExpenses
                      ? 'success'
                      : 'error'
                  }
                />
                <Typography variant="h5">
                  {formatCurrency(performance.totalActualExpenses, conversionCurrency)}
                </Typography>
              </Box>
              {performance.totalActualIncome > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Actual (Income)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon
                      color={
                        performance.totalActualIncome >= performance.totalBudgetedIncome
                          ? 'success'
                          : 'warning'
                      }
                    />
                    <Typography variant="body1">
                      {formatCurrency(performance.totalActualIncome, conversionCurrency)}
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
                {getHealthIcon(performance.overallHealthScore)}
                <Typography variant="h5" color={getHealthColor(performance.overallHealthScore)}>
                  {performance.overallHealthScore.toFixed(0)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {performance.overallHealthScore >= 80
                  ? 'On Track'
                  : performance.overallHealthScore >= 60
                    ? 'Needs Attention'
                    : 'Review Required'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Combined Trend Chart */}
      {trendData.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">Budget vs Actual Trend</Typography>
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
            data={trendData}
            lines={trendChartLines}
            height={300}
            formatValue={(value: number) => formatCurrency(value, conversionCurrency)}
          />
        </Paper>
      )}

      {/* Budget Performance Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Budget Performance Details
        </Typography>
        {performance.items.length === 0 ? (
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
                        handleItemClick(
                          item.isCategory ? item.categoryId : item.transactionTypeId,
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
