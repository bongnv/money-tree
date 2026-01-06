import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
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
  Checkbox,
  ListItemText,
  SelectChangeEvent,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { reportService } from '../../services/report.service';
import { LineChart } from '../charts/LineChart';
import { PieChart } from '../charts/PieChart';
import { formatCurrency } from '../../utils/currency.utils';
import { getTodayDate } from '../../utils/date.utils';
import type { CurrencyCode } from '../../types/enums';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';
import { Group } from '../../types/enums';

export const CashFlowReport: React.FC = () => {
  const transactions = useTransactionStore((state) => state.transactions);
  const transactionTypes = useCategoryStore((state) => state.transactionTypes);
  const categories = useCategoryStore((state) => state.categories);
  const accounts = useAccountStore((state) => state.accounts);
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const getRateForMonth = useExchangeRateStore((state) => state.getRateForMonth);
  const fetchRateIfMissing = useExchangeRateStore((state) => state.fetchRateIfMissing);

  // Date range state
  const today = getTodayDate();
  const firstDayOfMonth = `${today.slice(0, 7)}-01`;
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [periodType, setPeriodType] = useState<string>('current-month');
  const [conversionCurrency, setConversionCurrency] = useState<string>(baseCurrency);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Use the selected currency for display
  const currencyCode = conversionCurrency as CurrencyCode;

  // Always apply currency conversion
  const effectiveBaseCurrency = conversionCurrency;
  const effectiveGetRateForMonth = getRateForMonth;

  // Automatically fetch missing exchange rates in background
  useEffect(() => {
    // Get unique currency-month pairs from transactions in the date range
    const rateRequests = new Set<string>();
    const filteredTransactions = transactions.filter(
      (t) => t.date >= startDate && t.date <= endDate
    );

    filteredTransactions.forEach((transaction) => {
      // Check both fromAccountId and toAccountId
      const accountIds = [transaction.fromAccountId, transaction.toAccountId].filter(Boolean);

      accountIds.forEach((accountId) => {
        const account = accounts.find((a) => a.id === accountId);
        if (account?.currencyCode && account.currencyCode !== conversionCurrency) {
          const month = transaction.date.slice(0, 7); // YYYY-MM
          const key = `${month}-${account.currencyCode}`;
          rateRequests.add(key);
        }
      });
    });

    // Fetch missing rates
    rateRequests.forEach((key) => {
      const parts = key.split('-');
      const month = `${parts[0]}-${parts[1]}`; // YYYY-MM
      const currency = parts.slice(2).join('-'); // Handle currency codes with dashes
      fetchRateIfMissing(month, currency, conversionCurrency);
    });
  }, [conversionCurrency, startDate, endDate, transactions, accounts, fetchRateIfMissing]);

  // Update date range based on period preset
  const updatePeriodDates = (preset: string) => {
    const [year, month, day] = today.split('-').map(Number);
    const todayDate = new Date(year, month - 1, day);
    let newStartDate: Date;
    let newEndDate: Date = todayDate;

    switch (preset) {
      case 'current-month':
        newStartDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
        break;
      case 'last-month': {
        const lastMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
        newStartDate = lastMonth;
        newEndDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0); // Last day of previous month
        break;
      }
      case 'current-quarter': {
        const quarterStartMonth = Math.floor(todayDate.getMonth() / 3) * 3;
        newStartDate = new Date(todayDate.getFullYear(), quarterStartMonth, 1);
        break;
      }
      case 'last-quarter': {
        const quarterStartMonth = Math.floor(todayDate.getMonth() / 3) * 3;
        newStartDate = new Date(todayDate.getFullYear(), quarterStartMonth - 3, 1);
        newEndDate = new Date(todayDate.getFullYear(), quarterStartMonth, 0);
        break;
      }
      case 'current-year':
        newStartDate = new Date(todayDate.getFullYear(), 0, 1);
        break;
      case 'last-year':
        newStartDate = new Date(todayDate.getFullYear() - 1, 0, 1);
        newEndDate = new Date(todayDate.getFullYear() - 1, 11, 31);
        break;
      case 'custom':
        // Keep current dates
        return;
      default:
        return;
    }

    const startStr = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}`;
    const endStr = `${newEndDate.getFullYear()}-${String(newEndDate.getMonth() + 1).padStart(2, '0')}-${String(newEndDate.getDate()).padStart(2, '0')}`;
    setStartDate(startStr);
    setEndDate(endStr);
  };

  const handlePeriodChange = (event: SelectChangeEvent<string>) => {
    const newPeriod = event.target.value;
    setPeriodType(newPeriod);
    updatePeriodDates(newPeriod);
  };

  // Calculate cash flow for selected period
  const filteredTransactions = useMemo(() => {
    if (selectedCategories.length === 0) {
      return transactions;
    }
    return transactions.filter((tx) => {
      const txType = transactionTypes.find((tt) => tt.id === tx.transactionTypeId);
      return txType && selectedCategories.includes(txType.categoryId);
    });
  }, [transactions, transactionTypes, selectedCategories]);

  const cashFlow = useMemo(
    () =>
      reportService.calculateCashFlow(
        filteredTransactions,
        transactionTypes,
        categories,
        startDate,
        endDate,
        accounts,
        effectiveBaseCurrency,
        effectiveGetRateForMonth
      ),
    [
      filteredTransactions,
      transactionTypes,
      categories,
      startDate,
      endDate,
      accounts,
      effectiveBaseCurrency,
      effectiveGetRateForMonth,
    ]
  );

  // Calculate trend data
  const trendData = useMemo(() => {
    const intervalDays =
      periodType === 'current-year' || periodType === 'last-year'
        ? 30
        : periodType === 'current-quarter' || periodType === 'last-quarter'
          ? 7
          : 1;
    const trend = reportService.calculateCashFlowTrend(
      filteredTransactions,
      transactionTypes,
      categories,
      startDate,
      endDate,
      intervalDays,
      accounts,
      effectiveBaseCurrency,
      effectiveGetRateForMonth
    );

    return trend.map((point) => ({
      name: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      Income: point.income,
      Expenses: point.expenses,
      'Net Cash Flow': point.netCashFlow,
    }));
  }, [
    filteredTransactions,
    transactionTypes,
    categories,
    startDate,
    endDate,
    periodType,
    accounts,
    effectiveBaseCurrency,
    effectiveGetRateForMonth,
  ]);

  const handleCurrencyChange = (newCurrency: string) => {
    setConversionCurrency(newCurrency);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
  };

  // Prepare pie chart and table data - group by transaction type if categories are filtered
  const { incomePieData, expensesPieData, incomeDetailData, expenseDetailData, groupingLabel } =
    useMemo(() => {
      const hasFilter = selectedCategories.length > 0;

      if (!hasFilter) {
        // No filter - show by category
        return {
          incomePieData: cashFlow.income.map((cat) => ({
            name: cat.categoryName,
            value: cat.total,
          })),
          expensesPieData: cashFlow.expenses.map((cat) => ({
            name: cat.categoryName,
            value: cat.total,
          })),
          incomeDetailData: cashFlow.income,
          expenseDetailData: cashFlow.expenses,
          groupingLabel: 'Category',
        };
      }

      // Filter applied - group by transaction type
      const incomeByType = new Map<string, { name: string; total: number; count: number }>();
      const expenseByType = new Map<string, { name: string; total: number; count: number }>();

      filteredTransactions.forEach((tx) => {
        const txType = transactionTypes.find((tt) => tt.id === tx.transactionTypeId);
        if (!txType) return;

        // Get the appropriate account ID based on transaction type
        const accountId = txType.group === Group.INCOME ? tx.toAccountId : tx.fromAccountId;
        if (!accountId) return;

        const account = accounts.find((a) => a.id === accountId);
        if (!account) return;

        // Convert amount to base currency
        let convertedAmount = tx.amount;
        if (account.currencyCode !== effectiveBaseCurrency) {
          const txMonth = tx.date.substring(0, 7);
          const rate = effectiveGetRateForMonth(
            txMonth,
            account.currencyCode,
            effectiveBaseCurrency
          );
          if (rate) {
            convertedAmount = tx.amount * rate;
          }
        }

        if (txType.group === Group.INCOME) {
          const existing = incomeByType.get(txType.id) || {
            name: txType.name,
            total: 0,
            count: 0,
          };
          existing.total += convertedAmount;
          existing.count += 1;
          incomeByType.set(txType.id, existing);
        } else if (txType.group === Group.EXPENSE) {
          const existing = expenseByType.get(txType.id) || {
            name: txType.name,
            total: 0,
            count: 0,
          };
          existing.total += convertedAmount;
          existing.count += 1;
          expenseByType.set(txType.id, existing);
        }
      });

      return {
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
        })),
        expenseDetailData: Array.from(expenseByType.entries()).map(([id, item]) => ({
          categoryId: id,
          categoryName: item.name,
          total: item.total,
          transactionCount: item.count,
        })),
        groupingLabel: 'Transaction Type',
      };
    }, [
      cashFlow,
      selectedCategories,
      filteredTransactions,
      transactionTypes,
      accounts,
      effectiveBaseCurrency,
      effectiveGetRateForMonth,
    ]);

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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select value={periodType} label="Period" onChange={handlePeriodChange}>
                <MenuItem value="current-month">Current Month</MenuItem>
                <MenuItem value="last-month">Last Month</MenuItem>
                <MenuItem value="current-quarter">Current Quarter</MenuItem>
                <MenuItem value="last-quarter">Last Quarter</MenuItem>
                <MenuItem value="current-year">Current Year</MenuItem>
                <MenuItem value="last-year">Last Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={periodType !== 'custom'}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={periodType !== 'custom'}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Currency</InputLabel>
              <Select
                value={conversionCurrency}
                label="Currency"
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                {DEFAULT_CURRENCIES.map((curr) => (
                  <MenuItem key={curr.code} value={curr.code}>
                    {curr.code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Categories</InputLabel>
              <Select
                multiple
                value={selectedCategories}
                label="Categories"
                onChange={handleCategoryChange}
                renderValue={(selected) =>
                  selected.length === 0
                    ? 'All'
                    : selected.length === 1
                      ? categories.find((c) => c.id === selected[0])?.name || ''
                      : `${selected.length} selected`
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Checkbox checked={selectedCategories.includes(category.id)} />
                    <ListItemText primary={category.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Income
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="h5">
                  {formatCurrency(cashFlow.totalIncome, currencyCode)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Expenses
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDownIcon color="error" />
                <Typography variant="h5">
                  {formatCurrency(cashFlow.totalExpenses, currencyCode)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Net Cash Flow
              </Typography>
              <Typography
                variant="h5"
                color={cashFlow.netCashFlow >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(cashFlow.netCashFlow, currencyCode)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cash Flow Trend
          </Typography>
          <LineChart
            data={trendData}
            lines={[
              { dataKey: 'Income', color: '#4caf50', name: 'Income' },
              { dataKey: 'Expenses', color: '#f44336', name: 'Expenses' },
              { dataKey: 'Net Cash Flow', color: '#2196f3', name: 'Net Cash Flow' },
            ]}
            height={300}
            formatValue={(value: number) => formatCurrency(value, currencyCode)}
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
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Income by {groupingLabel}
              </Typography>
              <PieChart
                data={incomePieData}
                height={300}
                formatter={(value) => formatCurrency(value, currencyCode)}
              />
            </Paper>
          </Grid>
        )}
        {expensesPieData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Expenses by {groupingLabel}
              </Typography>
              <PieChart
                data={expensesPieData}
                height={300}
                formatter={(value) => formatCurrency(value, currencyCode)}
              />
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Detailed Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Income Details
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{groupingLabel}</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeDetailData.map((item) => (
                    <TableRow key={item.categoryId}>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell align="right">{item.transactionCount}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.total, currencyCode)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {incomeDetailData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No income transactions
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Expense Details
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{groupingLabel}</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenseDetailData.map((item) => (
                    <TableRow key={item.categoryId}>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell align="right">{item.transactionCount}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.total, currencyCode)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenseDetailData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No expense transactions
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
