import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BudgetProgressBar } from './BudgetProgressBar';
import { useBudgetOverview } from '@/hooks/dashboard/useBudgetOverview';
import { useStore } from '@/contexts/StoreContext';
import type { PeriodOption } from '../common/PeriodSelector';

export interface BudgetOverviewProps {
  period: PeriodOption;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ period }) => {
  const { baseCurrency } = useStore();
  const { budgets, isLoading } = useBudgetOverview(period, baseCurrency);

  if (isLoading || budgets.length === 0) {
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
      {budgets.map((budgetItem) => (
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
