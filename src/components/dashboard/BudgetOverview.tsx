import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BudgetProgressBar } from './BudgetProgressBar';
import { useCalculationService } from '../../contexts/ServiceProviders';
import type { PeriodOption } from '../common/PeriodSelector';
import { Group } from '../../types/enums';
import { useActiveAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { useTransactionTypes } from '../../hooks/useTransactionTypes';
import { useBudgets } from '../../hooks/useBudgets';
import { useBaseCurrency } from '../../hooks/useSyncMetadata';

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
  const budgets = useBudgets();
  const transactions = useTransactions();
  const transactionTypes = useTransactionTypes();
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();
  const calculationService = useCalculationService();

  const [budgetsWithUsage, setBudgetsWithUsage] = useState<BudgetWithUsage[]>([]);

  // Calculate budget usage for the selected period
  useEffect(() => {
    if (!budgets || !transactions || !transactionTypes || !accounts) return;

    const calculateBudgets = async () => {
      const results: BudgetWithUsage[] = [];

      for (const budget of budgets) {
        // Get active budget for this period
        const activeBudget = calculationService.getActiveBudgetForPeriod(
          budgets.filter((b) => b.transactionTypeId === budget.transactionTypeId),
          budget.transactionTypeId,
          period.startDate
        );

        if (!activeBudget || activeBudget.id !== budget.id) {
          continue;
        }

        // Prorate budget amount for the selected period
        const proratedAmount = calculationService.prorateBudgetForPeriod(
          budget,
          period.startDate,
          period.endDate
        );

        // Convert budget to base currency if needed
        const convertedBudget = await calculationService.convertBudgetAmount(
          { ...budget, amount: proratedAmount },
          period.startDate.slice(0, 7),
          baseCurrency
        );

        // Calculate actual spending/income with currency conversion
        const relevantTransactions = transactions.filter(
          (t) =>
            t.transactionTypeId === budget.transactionTypeId &&
            t.date >= period.startDate &&
            t.date <= period.endDate
        );

        const actualAmount = await calculationService.sumTransactionAmounts(
          relevantTransactions,
          accounts,
          baseCurrency
        );

        // Get transaction type info
        const transactionType = transactionTypes.find((t) => t.id === budget.transactionTypeId);

        const isIncome = transactionType?.group === Group.INCOME;
        const percentage = convertedBudget === 0 ? 0 : (actualAmount / convertedBudget) * 100;

        results.push({
          id: budget.id,
          name: transactionType?.name || 'Unknown',
          spent: actualAmount,
          budget: convertedBudget,
          percentage,
          isIncome,
        });
      }

      // Sort and take top 5
      const sorted = results.sort((a, b) => b.percentage - a.percentage).slice(0, 5);
      setBudgetsWithUsage(sorted);
    };

    calculateBudgets();
  }, [
    budgets,
    transactions,
    transactionTypes,
    accounts,
    period.startDate,
    period.endDate,
    baseCurrency,
    calculationService,
  ]);

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
          baseCurrency={baseCurrency}
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
