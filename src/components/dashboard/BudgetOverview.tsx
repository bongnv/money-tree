import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BudgetProgressBar } from './BudgetProgressBar';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { calculationService } from '../../services/calculation.service';
import type { PeriodOption } from './PeriodSelector';
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
  const categories = useCategoryStore((state) => state.categories);

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
      const proratedAmount = calculationService.prorateBudgetForPeriod(
        budget,
        period.startDate,
        period.endDate
      );

      // Calculate actual spending/income for the period
      const actualAmount = calculationService.calculateActualAmount(
        budget.transactionTypeId,
        transactions,
        period.startDate,
        period.endDate
      );

      // Get transaction type info
      const transactionType = transactionTypes.find((t) => t.id === budget.transactionTypeId);
      const category = transactionType
        ? categories.find((c) => c.id === transactionType.categoryId)
        : undefined;

      const isIncome = category?.group === Group.INCOME;
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
