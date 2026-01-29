import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { budgetService } from '../../services/budget.service';
import { categoryService } from '../../services/category.service';
import { transactionTypeService } from '../../services/transactionType.service';
import { accountService } from '../../services/account.service';
import { assetService } from '../../services/asset.service';
import { transactionService } from '../../services/transaction.service';
import { syncMetadataService } from '../../services/syncMetadata.service';
import { CurrencyCode } from '../../types/enums';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { Box, Alert } from '@mui/material';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { useCalculationService, useReportService } from '../../contexts/ServiceProviders';
import type { PeriodOption } from '../common/PeriodSelector';
import { formatCurrency } from '../../utils/currency.utils';
import { getCurrentMonth } from '../../utils/date.utils';

export interface FinancialSummaryProps {
  period: PeriodOption;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ period }) => {
  const navigate = useNavigate();
  const accounts = useLiveQuery(() => accountService.getActive()) ?? [];
  const transactions = useLiveQuery(() => transactionService.getActive()) ?? [];
  const manualAssets = useLiveQuery(() => assetService.getActive()) ?? [];
  const budgets = useLiveQuery(() => budgetService.getActive()) ?? [];
  const categories = useLiveQuery(() => categoryService.getActive()) ?? [];
  const transactionTypes = useLiveQuery(() => transactionTypeService.getActive()) ?? [];
  const baseCurrency =
    useLiveQuery(() => syncMetadataService.getBaseCurrency()) || CurrencyCode.USD;
  const calculationService = useCalculationService();
  const reportService = useReportService();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [netWorth, setNetWorth] = useState<number>(0);
  const [cashFlow, setCashFlow] = useState<number>(0);
  const [savingsRate, setSavingsRate] = useState<number>(0);
  const [budgetHealth, setBudgetHealth] = useState<number>(0);

  // Get current month in YYYY-MM format (local timezone)
  const currentMonth = getCurrentMonth();

  // Calculate net worth with currency conversion
  useEffect(() => {
    if (!accounts || !transactions || !manualAssets) return;

    const calculateNetWorth = async () => {
      try {
        const worth = await calculationService.calculateNetWorth(
          accounts,
          transactions,
          manualAssets,
          baseCurrency,
          currentMonth
        );
        setNetWorth(worth);
        setErrorMessage(null);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
        setNetWorth(0);
      }
    };

    calculateNetWorth();
  }, [accounts, transactions, manualAssets, baseCurrency, currentMonth, calculationService]);

  // Calculate cash flow and budget performance
  useEffect(() => {
    if (!transactions || !transactionTypes || !categories || !accounts || !budgets) return;

    const calculateMetrics = async () => {
      const periodTransactions = transactions.filter(
        (t) => t.date >= period.startDate && t.date <= period.endDate
      );

      const cashFlowData = await reportService.calculateCashFlow(
        periodTransactions,
        transactionTypes,
        categories,
        period.startDate,
        period.endDate,
        accounts,
        baseCurrency
      );

      setCashFlow(cashFlowData.netCashFlow);

      const rate = calculationService.calculateSavingsRate(
        cashFlowData.totalIncome,
        cashFlowData.totalExpenses
      );
      setSavingsRate(rate);

      const budgetPerformance = await reportService.calculateBudgetPerformance(
        budgets,
        periodTransactions,
        transactionTypes,
        categories,
        period.startDate,
        period.endDate,
        accounts,
        baseCurrency
      );

      setBudgetHealth(budgetPerformance.overallHealthScore);
    };

    calculateMetrics();
  }, [
    transactions,
    period,
    transactionTypes,
    categories,
    accounts,
    baseCurrency,
    budgets,
    calculationService,
    reportService,
  ]);

  // Determine savings rate color
  const getSavingsRateColor = (): 'success' | 'warning' | 'error' => {
    if (savingsRate >= 20) return 'success';
    if (savingsRate >= 10) return 'warning';
    return 'error';
  };

  // Determine budget health color
  const getBudgetHealthColor = (): 'success' | 'warning' | 'error' => {
    if (budgetHealth >= 80) return 'success';
    if (budgetHealth >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Net Worth"
            value={formatCurrency(netWorth, baseCurrency)}
            onClick={() => navigate('/reports/balance-sheet')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Cash Flow"
            value={formatCurrency(cashFlow, baseCurrency)}
            color={cashFlow >= 0 ? 'success' : 'error'}
            onClick={() => navigate('/reports/cash-flow')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Savings Rate"
            value={`${savingsRate.toFixed(1)}%`}
            color={getSavingsRateColor()}
            onClick={() => navigate('/reports/cash-flow')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Budget Health"
            value={`${budgetHealth.toFixed(0)}%`}
            color={getBudgetHealthColor()}
            onClick={() => navigate('/reports/budget-performance')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
