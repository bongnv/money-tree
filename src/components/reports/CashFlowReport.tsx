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
  Button,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
import { useReportService, useCalculationService } from '../../contexts/ServiceProviders';
import { LineChart } from '../charts/LineChart';
import { PieChart } from '../charts/PieChart';
import { PeriodSelector } from '../common/PeriodSelector';
import { CategoryFilter } from '../common/CategoryFilter';
import { formatCurrency } from '../../utils/currency.utils';
import { getTodayDate } from '../../utils/date.utils';
import { CHART_COLORS } from '../../theme';
import type { CurrencyCode } from '../../types/enums';
import type { CashFlowData } from '../../services/report.service';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';

export const CashFlowReport: React.FC = () => {
  const navigate = useNavigate();
  const transactions = useTransactionStore((state) => state.transactions);
  const transactionTypes = useCategoryStore((state) => state.transactionTypes);
  const categories = useCategoryStore((state) => state.categories);
  const accounts = useAccountStore((state) => state.accounts);
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const reportService = useReportService();
  const calculationService = useCalculationService();

  // Date range state - default to Year to Date
  const today = getTodayDate();
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const [startDate, setStartDate] = useState<string>(yearStart);
  const [endDate, setEndDate] = useState<string>(today);
  const [conversionCurrency, setConversionCurrency] = useState<CurrencyCode>(baseCurrency);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
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

  const [cashFlow, setCashFlow] = useState<CashFlowData>({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    income: [],
    expenses: [],
  });

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, conversionCurrency, selectedCategories]);
  // filteredTransactions, transactionTypes, categories, accounts, and effectiveGetRateForMonth are stable or captured in closure

  // Calculate trend data
  const [trendData, setTrendData] = useState<any>([]);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, conversionCurrency, selectedCategories]);
  // filteredTransactions, transactionTypes, categories, accounts, and effectiveGetRateForMonth are stable or captured in closure
  // effectiveGetRateForMonth is stable from Zustand store

  // Prepare chart data
  const chartData = useMemo(() => {
    return trendData.map((point: any) => ({
      name: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      Income: point.income,
      Expenses: point.expenses,
      'Net Cash Flow': point.netCashFlow,
    }));
  }, [trendData]);

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

  // Prepare pie chart and table data - group by transaction type if categories are filtered
  const [chartTableData, setChartTableData] = useState<{
    incomePieData: { name: string; value: number }[];
    expensesPieData: { name: string; value: number }[];
    incomeDetailData: any[];
    expenseDetailData: any[];
    groupingLabel: string;
  }>({
    incomePieData: [],
    expensesPieData: [],
    incomeDetailData: [],
    expenseDetailData: [],
    groupingLabel: 'Category',
  });

  useEffect(() => {
    const calculateChartData = async () => {
      const hasFilter = selectedCategories.length > 0;

      if (!hasFilter) {
        // No filter - show by category
        setChartTableData({
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
        });
        return;
      }

      // Filter applied - group by transaction type using calculation service
      const { incomeByType, expenseByType } =
        await calculationService.calculateTransactionTypeGrouping(
          filteredTransactions,
          transactionTypes,
          accounts,
          conversionCurrency
        );

      setChartTableData({
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

    calculateChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, conversionCurrency]);
  // cashFlow, filteredTransactions, transactionTypes, and accounts are stable or captured in closure

  const { incomePieData, expensesPieData, incomeDetailData, expenseDetailData, groupingLabel } =
    chartTableData;

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
        <Grid item xs={12} md={4}>
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
                {formatCurrency(cashFlow.netCashFlow, conversionCurrency)}
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
            data={chartData}
            lines={[
              { dataKey: 'Income', color: CHART_COLORS.simple.income, name: 'Income' },
              { dataKey: 'Expenses', color: CHART_COLORS.simple.expense, name: 'Expenses' },
              {
                dataKey: 'Net Cash Flow',
                color: CHART_COLORS.simple.netCashFlow,
                name: 'Net Cash Flow',
              },
            ]}
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
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
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
      </Grid>
    </Box>
  );
};
