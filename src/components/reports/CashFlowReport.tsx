import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { reportService, PeriodType } from '../../services/report.service';
import { LineChart } from '../charts/LineChart';
import { PieChart } from '../charts/PieChart';
import { formatCurrency } from '../../utils/currency.utils';
import { getTodayDate } from '../../utils/date.utils';

export const CashFlowReport: React.FC = () => {
  const transactions = useTransactionStore((state) => state.transactions);
  const transactionTypes = useCategoryStore((state) => state.transactionTypes);
  const categories = useCategoryStore((state) => state.categories);

  // Date range state
  const today = getTodayDate();
  const firstDayOfMonth = `${today.slice(0, 7)}-01`;
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');

  // Assume USD for now - in future this should come from app settings
  const currencyId = 'usd';

  // Update date range based on period type
  const updatePeriodDates = (period: PeriodType) => {
    const [year, month, day] = today.split('-').map(Number);
    const todayDate = new Date(year, month - 1, day);
    let newStartDate = new Date(todayDate);

    switch (period) {
      case 'monthly':
        newStartDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
        break;
      case 'quarterly':
        const quarterStartMonth = Math.floor(todayDate.getMonth() / 3) * 3;
        newStartDate = new Date(todayDate.getFullYear(), quarterStartMonth, 1);
        break;
      case 'yearly':
        newStartDate = new Date(todayDate.getFullYear(), 0, 1);
        break;
      case 'custom':
        // Keep current dates
        return;
    }

    const startStr = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}`;
    setStartDate(startStr);
    setEndDate(today);
  };

  const handlePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: PeriodType | null
  ) => {
    if (newPeriod) {
      setPeriodType(newPeriod);
      updatePeriodDates(newPeriod);
    }
  };

  // Calculate cash flow for selected period
  const cashFlow = useMemo(
    () =>
      reportService.calculateCashFlow(
        transactions,
        transactionTypes,
        categories,
        startDate,
        endDate
      ),
    [transactions, transactionTypes, categories, startDate, endDate]
  );

  // Calculate trend data
  const trendData = useMemo(() => {
    const intervalDays = periodType === 'yearly' ? 30 : periodType === 'quarterly' ? 7 : 1;
    const trend = reportService.calculateCashFlowTrend(
      transactions,
      transactionTypes,
      categories,
      startDate,
      endDate,
      intervalDays
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
  }, [transactions, transactionTypes, categories, startDate, endDate, periodType]);

  // Prepare pie chart data
  const incomePieData = cashFlow.income.map((cat) => ({
    name: cat.categoryName,
    value: cat.total,
  }));

  const expensesPieData = cashFlow.expenses.map((cat) => ({
    name: cat.categoryName,
    value: cat.total,
  }));

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
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <ToggleButtonGroup
              value={periodType}
              exclusive
              onChange={handlePeriodChange}
              aria-label="period type"
              fullWidth
            >
              <ToggleButton value="monthly" aria-label="monthly">
                Monthly
              </ToggleButton>
              <ToggleButton value="quarterly" aria-label="quarterly">
                Quarterly
              </ToggleButton>
              <ToggleButton value="yearly" aria-label="yearly">
                Yearly
              </ToggleButton>
              <ToggleButton value="custom" aria-label="custom">
                Custom
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={periodType !== 'custom'}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={periodType !== 'custom'}
            />
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
                  {formatCurrency(cashFlow.totalIncome, currencyId)}
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
                  {formatCurrency(cashFlow.totalExpenses, currencyId)}
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
                {formatCurrency(cashFlow.netCashFlow, currencyId)}
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
            formatValue={(value: number) => formatCurrency(value, currencyId)}
          />
        </Paper>
      )}

      {/* Category Breakdown Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {incomePieData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Income by Category
              </Typography>
              <PieChart
                data={incomePieData}
                height={300}
                formatter={(value) => formatCurrency(value, currencyId)}
              />
            </Paper>
          </Grid>
        )}
        {expensesPieData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Expenses by Category
              </Typography>
              <PieChart
                data={expensesPieData}
                height={300}
                formatter={(value) => formatCurrency(value, currencyId)}
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
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cashFlow.income.map((item) => (
                    <TableRow key={item.categoryId}>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell align="right">{item.transactionCount}</TableCell>
                      <TableCell align="right">{formatCurrency(item.total, currencyId)}</TableCell>
                    </TableRow>
                  ))}
                  {cashFlow.income.length === 0 && (
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
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cashFlow.expenses.map((item) => (
                    <TableRow key={item.categoryId}>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell align="right">{item.transactionCount}</TableCell>
                      <TableCell align="right">{formatCurrency(item.total, currencyId)}</TableCell>
                    </TableRow>
                  ))}
                  {cashFlow.expenses.length === 0 && (
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
