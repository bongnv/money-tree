import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { reportService } from '../../services/report.service';
import { LineChart } from '../charts/LineChart';
import { PeriodSelector } from '../common/PeriodSelector';
import { CategoryFilter } from '../common/CategoryFilter';
import { formatCurrency } from '../../utils/currency.utils';
import { getTodayDate } from '../../utils/date.utils';
import { CHART_COLORS } from '../../theme';
import type { CurrencyCode } from '../../types/enums';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';

export const BudgetPerformanceReport: React.FC = () => {
  const navigate = useNavigate();
  const budgets = useBudgetStore((state) => state.budgets);
  const transactions = useTransactionStore((state) => state.transactions);
  const transactionTypes = useCategoryStore((state) => state.transactionTypes);
  const categories = useCategoryStore((state) => state.categories);
  const accounts = useAccountStore((state) => state.accounts);
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const getRateForMonth = useExchangeRateStore((state) => state.getRateForMonth);
  const fetchRateIfMissing = useExchangeRateStore((state) => state.fetchRateIfMissing);

  // Date range state - default to Year to Date
  const today = getTodayDate();
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const [startDate, setStartDate] = useState<string>(yearStart);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<string>(baseCurrency);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const currencyCode = conversionCurrency as CurrencyCode;

  // Automatically fetch missing exchange rates in background
  useEffect(() => {
    const rateRequests = new Set<string>();
    const filteredTxns = transactions.filter((t) => t.date >= startDate && t.date <= endDate);

    filteredTxns.forEach((transaction) => {
      const accountIds = [transaction.fromAccountId, transaction.toAccountId].filter(Boolean);

      accountIds.forEach((accountId) => {
        const account = accounts.find((a) => a.id === accountId);
        if (account?.currencyCode && account.currencyCode !== conversionCurrency) {
          const month = transaction.date.slice(0, 7);
          const key = `${month}-${account.currencyCode}`;
          rateRequests.add(key);
        }
      });
    });

    rateRequests.forEach((key) => {
      const parts = key.split('-');
      const month = `${parts[0]}-${parts[1]}`;
      const currency = parts.slice(2).join('-');
      fetchRateIfMissing(month, currency, conversionCurrency);
    });
  }, [conversionCurrency, startDate, endDate, transactions, accounts, fetchRateIfMissing]);

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
  const performance = useMemo(
    () =>
      reportService.calculateBudgetPerformance(
        filteredBudgets,
        filteredTransactions,
        transactionTypes,
        categories,
        startDate,
        endDate,
        accounts,
        conversionCurrency,
        getRateForMonth
      ),
    [
      filteredBudgets,
      filteredTransactions,
      transactionTypes,
      categories,
      startDate,
      endDate,
      accounts,
      conversionCurrency,
      getRateForMonth,
    ]
  );

  // Calculate trend data
  const trendData = useMemo(() => {
    // Determine interval based on date range duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const intervalDays = daysDiff > 180 ? 30 : daysDiff > 60 ? 7 : 1;

    const trend = reportService.calculateBudgetTrend(
      filteredBudgets,
      filteredTransactions,
      transactionTypes,
      categories,
      startDate,
      endDate,
      intervalDays,
      accounts,
      conversionCurrency,
      getRateForMonth
    );

    return trend.map((point) => ({
      name: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      'Income Target': point.budgetedIncome,
      'Income Actual': point.actualIncome,
      'Expense Budgeted': point.budgeted,
      'Expense Actual': point.actual,
    }));
  }, [
    filteredBudgets,
    filteredTransactions,
    transactionTypes,
    categories,
    startDate,
    endDate,
    accounts,
    conversionCurrency,
    getRateForMonth,
  ]);

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

  const handleItemClick = (itemId: string, isTransactionType: boolean) => {
    const params = new URLSearchParams();
    if (isTransactionType) {
      params.set('transactionTypeId', itemId);
    } else {
      params.set('categoryId', itemId);
    }
    params.set('dateFrom', startDate);
    params.set('dateTo', endDate);
    navigate(`/transactions?${params.toString()}`);
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    if (selectedCategories.length > 0) {
      // When filtered, don't group by category
      return [
        {
          categoryId: 'all',
          categoryName: 'All Items',
          items: performance.items,
        },
      ];
    }

    const groups = new Map<string, typeof performance.items>();
    performance.items.forEach((item) => {
      const existing = groups.get(item.categoryId) || [];
      existing.push(item);
      groups.set(item.categoryId, existing);
    });

    return Array.from(groups.entries()).map(([categoryId, items]) => ({
      categoryId,
      categoryName: items[0]?.categoryName || 'Unknown',
      items,
    }));
  }, [performance.items, selectedCategories]);

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
          <Grid item xs={12} sm={6} md={4}>
            <PeriodSelector
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={conversionCurrency}
                label="Currency"
                onChange={(e) => setConversionCurrency(e.target.value)}
              >
                {DEFAULT_CURRENCIES.map((curr) => (
                  <MenuItem key={curr.code} value={curr.code}>
                    {curr.code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4.5}>
            <CategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onChange={handleCategoryChange}
              onClear={handleClearFilters}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
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
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Budgeted (Expenses)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDownIcon color="primary" />
                <Typography variant="h5">
                  {formatCurrency(performance.totalBudgetedExpenses, currencyCode)}
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
                      {formatCurrency(performance.totalBudgetedIncome, currencyCode)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
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
                  {formatCurrency(performance.totalActualExpenses, currencyCode)}
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
                      {formatCurrency(performance.totalActualIncome, currencyCode)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
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
          <Typography variant="h6" gutterBottom>
            Budget vs Actual Trend
          </Typography>
          <LineChart
            data={trendData}
            lines={[
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
              },
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
              },
            ]}
            height={300}
            formatValue={(value: number) => formatCurrency(value, currencyCode)}
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
                {groupedItems.map((group) => (
                  <React.Fragment key={group.categoryId}>
                    {selectedCategories.length === 0 && (
                      <TableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell colSpan={6}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {group.categoryName}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {group.items.map((item) => {
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
                          key={item.budgetId}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleItemClick(item.transactionTypeId, true)}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {selectedCategories.length === 0 && '  '}
                              {item.transactionTypeName}
                              {item.isIncome && (
                                <Chip label="Income" size="small" color="success" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.budgetedAmount, currencyCode)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.actualAmount, currencyCode)}
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
                              {formatCurrency(Math.abs(item.remaining), currencyCode)}
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
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};
