import React, { useEffect, useState } from 'react';
import { Box, Grid, Alert } from '@mui/material';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAssetStore } from '../../stores/useAssetStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { calculationService } from '../../services/calculation.service';
import type { PeriodOption } from './PeriodSelector';

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
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const getRateForMonth = useExchangeRateStore((state) => state.getRateForMonth);
  const rates = useExchangeRateStore((state) => state.rates);
  const fetchRateIfMissing = useExchangeRateStore((state) => state.fetchRateIfMissing);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Fetch missing exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      if (!baseCurrency) return;

      // Get unique currencies that need conversion
      const currencies = new Set<string>();
      accounts.forEach((account) => {
        if (account.currencyId && account.currencyId.toUpperCase() !== baseCurrency.toUpperCase()) {
          currencies.add(account.currencyId);
        }
      });
      manualAssets.forEach((asset) => {
        if (asset.currencyId && asset.currencyId.toUpperCase() !== baseCurrency.toUpperCase()) {
          currencies.add(asset.currencyId);
        }
      });

      // Fetch rates for all currencies to base currency
      const fetchPromises: Promise<number | null>[] = [];
      currencies.forEach((currency) => {
        fetchPromises.push(fetchRateIfMissing(currentMonth, currency, baseCurrency));
      });

      await Promise.allSettled(fetchPromises);
    };

    fetchRates();
  }, [accounts, manualAssets, baseCurrency, currentMonth, fetchRateIfMissing]);

  // Calculate net worth with currency conversion - wrapped in useEffect to avoid infinite loop
  const [netWorth, setNetWorth] = useState(0);

  useEffect(() => {
    try {
      const calculatedNetWorth = calculationService.calculateNetWorth(
        accounts,
        transactions,
        manualAssets,
        baseCurrency,
        getRateForMonth,
        currentMonth
      );
      setNetWorth(calculatedNetWorth);
      // Clear error if calculation succeeds
      setErrorMessage(null);
    } catch (error) {
      // Capture the error message to display to user
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
      setNetWorth(0);
    }
  }, [accounts, transactions, manualAssets, baseCurrency, getRateForMonth, currentMonth, rates]);

  // Calculate cash flow for current period
  const periodTransactions = transactions.filter(
    (t) => t.date >= period.startDate && t.date <= period.endDate
  );
  const income = calculationService.calculateTotalIncome(periodTransactions);
  const expenses = calculationService.calculateTotalExpenses(periodTransactions);
  const cashFlow = income - expenses;

  // Calculate savings rate
  const savingsRate = calculationService.calculateSavingsRate(income, expenses);

  // Determine savings rate color
  const getSavingsRateColor = (): 'success' | 'warning' | 'error' => {
    if (savingsRate >= 20) return 'success';
    if (savingsRate >= 10) return 'warning';
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
        <Grid item xs={12} sm={6} md={4}>
          <FinancialSummaryCard title="Net Worth" value={formatAmount(netWorth)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FinancialSummaryCard
            title="Cash Flow"
            value={formatAmount(cashFlow)}
            color={cashFlow >= 0 ? 'success' : 'error'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FinancialSummaryCard
            title="Savings Rate"
            value={`${savingsRate.toFixed(1)}%`}
            color={getSavingsRateColor()}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
