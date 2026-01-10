import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BudgetProgressBar } from './BudgetProgressBar';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { calculationService } from '../../services/calculation.service';
import type { PeriodOption } from '../common/PeriodSelector';
import { Group } from '../../types/enums';

export interface BudgetOverviewProps {
  period: PeriodOption;
}

interface BudgetWithUsage {
  id: string;
  name: string;
  spent: number;
  budget: number;
  percentage: number;
  isIncome: boolean;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ period }) => {
  const budgets = useBudgetStore((state) => state.budgets);
  const transactions = useTransactionStore((state) => state.transactions);
  const transactionTypes = useCategoryStore((state) => state.transactionTypes);
  const accounts = useAccountStore((state) => state.accounts);
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const getRateForMonth = useExchangeRateStore((state) => state.getRateForMonth);

  // Calculate budget usage for the selected period
  const budgetsWithUsage: BudgetWithUsage[] = budgets
    .map((budget) => {
      // Get active budget for this period
      const activeBudget = calculationService.getActiveBudgetForPeriod(
        budgets.filter((b) => b.transactionTypeId === budget.transactionTypeId),
        budget.transactionTypeId,
        period.startDate
      );

      if (!activeBudget || activeBudget.id !== budget.id) {
        return null;
      }

      // Prorate budget amount for the selected period
      let proratedAmount = calculationService.prorateBudgetForPeriod(
        budget,
        period.startDate,
        period.endDate
      );

      // Convert budget to base currency if needed
      if (baseCurrency && getRateForMonth && budget.currencyCode !== baseCurrency) {
        const month = period.startDate.slice(0, 7);
        const rate = getRateForMonth(month, budget.currencyCode, baseCurrency);
        if (rate !== null) {
          proratedAmount = proratedAmount * rate;
        }
      }

      // Calculate actual spending/income with currency conversion
      let actualAmount = 0;
      const relevantTransactions = transactions.filter(
        (t) =>
          t.transactionTypeId === budget.transactionTypeId &&
          t.date >= period.startDate &&
          t.date <= period.endDate
      );

      relevantTransactions.forEach((transaction) => {
        let convertedAmount = transaction.amount;

        // Convert transaction amount to base currency if needed
        if (baseCurrency && getRateForMonth) {
          const accountId = transaction.fromAccountId || transaction.toAccountId;
          const account = accounts.find((a) => a.id === accountId);

          if (account && account.currencyCode !== baseCurrency) {
            const month = transaction.date.slice(0, 7);
            const rate = getRateForMonth(month, account.currencyCode, baseCurrency);
            if (rate !== null) {
              convertedAmount = transaction.amount * rate;
            }
          }
        }

        actualAmount += convertedAmount;
      });

      // Get transaction type info
      const transactionType = transactionTypes.find((t) => t.id === budget.transactionTypeId);

      const isIncome = transactionType?.group === Group.INCOME;
      const percentage = proratedAmount === 0 ? 0 : (actualAmount / proratedAmount) * 100;

      return {
        id: budget.id,
        name: transactionType?.name || 'Unknown',
        spent: actualAmount,
        budget: proratedAmount,
        percentage,
        isIncome,
      };
    })
    .filter((b): b is BudgetWithUsage => b !== null)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  if (budgetsWithUsage.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Set up budgets to track spending
        </Typography>
        <Button
          component={RouterLink}
          to="/budgets"
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Create Budget
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {budgetsWithUsage.map((budgetItem) => (
        <BudgetProgressBar
          key={budgetItem.id}
          name={budgetItem.name}
          spent={budgetItem.spent}
          budget={budgetItem.budget}
          isIncome={budgetItem.isIncome}
        />
      ))}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button component={RouterLink} to="/budgets" variant="text" color="primary">
          View All Budgets
        </Button>
      </Box>
    </Box>
  );
};
