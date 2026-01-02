import React from 'react';
import { Box, Grid } from '@mui/material';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAssetStore } from '../../stores/useAssetStore';
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

  // Calculate net worth
  const netWorth = calculationService.calculateNetWorth(accounts, transactions, manualAssets);

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
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <FinancialSummaryCard
            title="Net Worth"
            value={formatAmount(netWorth)}
          />
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
