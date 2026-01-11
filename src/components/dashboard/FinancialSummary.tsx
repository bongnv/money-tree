import React, { useEffect, useState } from 'react';
import { Box, Grid, Alert } from '@mui/material';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { calculationService } from '../../services/calculation.service';
import { reportService } from '../../services/report.service';
import type { PeriodOption } from '../common/PeriodSelector';

export interface FinancialSummaryProps {
  period: PeriodOption;
}

const formatAmount = (amount: number): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return formatter.format(amount);
};

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ period }) => {
  const accounts = useAccountStore((state) => state.accounts);
  const transactions = useTransactionStore((state) => state.transactions);
  const manualAssets = useAssetStore((state) => state.manualAssets);
  const budgets = useBudgetStore((state) => state.budgets);
  const categories = useCategoryStore((state) => state.categories);
  const transactionTypes = useCategoryStore((state) => state.transactionTypes);
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const getRateForMonth = useExchangeRateStore((state) => state.getRateForMonth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [netWorth, setNetWorth] = useState<number>(0);
  const [cashFlow, setCashFlow] = useState<number>(0);
  const [savingsRate, setSavingsRate] = useState<number>(0);
  const [budgetHealth, setBudgetHealth] = useState<number>(0);

  // Get current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Fetch missing exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      if (!baseCurrency) return;

      // Get unique currencies that need conversion
      const currencies = new Set<string>();
      accounts.forEach((account) => {
        if (
          account.currencyCode &&
          account.currencyCode.toUpperCase() !== baseCurrency.toUpperCase()
        ) {
          currencies.add(account.currencyCode);
        }
      });
      manualAssets.forEach((asset) => {
        if (asset.currencyCode && asset.currencyCode.toUpperCase() !== baseCurrency.toUpperCase()) {
          currencies.add(asset.currencyCode);
        }
      });

      // Fetch rates for all currencies to base currency
      const fetchPromises: Promise<number | null>[] = [];
      currencies.forEach((currency) => {
        fetchPromises.push(getRateForMonth(currentMonth, currency, baseCurrency));
      });

      await Promise.allSettled(fetchPromises);
    };

    fetchRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, manualAssets, baseCurrency, currentMonth]);
  // getRateForMonth is stable from Zustand store

  // Calculate net worth with currency conversion
  useEffect(() => {
    const calculateNetWorth = async () => {
      try {
        const worth = await calculationService.calculateNetWorth(
          accounts,
          transactions,
          manualAssets,
          baseCurrency,
          getRateForMonth,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, transactions, manualAssets, baseCurrency, currentMonth]);
  // getRateForMonth is stable from Zustand store

  // Calculate cash flow and budget performance
  useEffect(() => {
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
        baseCurrency,
        getRateForMonth
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
        baseCurrency,
        getRateForMonth
      );

      setBudgetHealth(budgetPerformance.overallHealthScore);
    };

    calculateMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, period, transactionTypes, categories, accounts, baseCurrency, budgets]);
  // getRateForMonth is stable from Zustand store

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
        <Grid item xs={12} sm={6} md={3}>
          <FinancialSummaryCard title="Net Worth" value={formatAmount(netWorth)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialSummaryCard
            title="Cash Flow"
            value={formatAmount(cashFlow)}
            color={cashFlow >= 0 ? 'success' : 'error'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialSummaryCard
            title="Savings Rate"
            value={`${savingsRate.toFixed(1)}%`}
            color={getSavingsRateColor()}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialSummaryCard
            title="Budget Health"
            value={`${budgetHealth.toFixed(0)}%`}
            color={getBudgetHealthColor()}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
