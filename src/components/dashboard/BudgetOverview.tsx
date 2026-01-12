import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BudgetProgressBar } from './BudgetProgressBar';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
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

  const [budgetsWithUsage, setBudgetsWithUsage] = useState<BudgetWithUsage[]>([]);

  // Calculate budget usage for the selected period
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.startDate, period.endDate, baseCurrency]);
  // budgets, transactions, transactionTypes, accounts, and getRateForMonth are stable from Zustand or captured in closure

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
