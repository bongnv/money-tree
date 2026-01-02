import React from 'react';
import { Box, Typography, LinearProgress, styled } from '@mui/material';

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'progressColor',
})<{ progressColor: 'success' | 'warning' | 'error' }>(({ theme, progressColor }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    backgroundColor:
      progressColor === 'success'
        ? theme.palette.success.main
        : progressColor === 'warning'
          ? theme.palette.warning.main
          : theme.palette.error.main,
  },
}));

export interface BudgetProgressBarProps {
  name: string;
  spent: number;
  budget: number;
  isIncome?: boolean;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  name,
  spent,
  budget,
  isIncome = false,
}) => {
  const percentage = budget === 0 ? 0 : (spent / budget) * 100;

  // Color coding based on whether it's income or expense
  const getProgressColor = (): 'success' | 'warning' | 'error' => {
    if (isIncome) {
      // Income: green >= 100%, yellow 60-99%, red < 60%
      if (percentage >= 100) return 'success';
      if (percentage >= 60) return 'warning';
      return 'error';
    } else {
      // Expense: green < 80%, yellow 80-100%, red > 100%
      if (percentage < 80) return 'success';
      if (percentage <= 100) return 'warning';
      return 'error';
    }
  };

  const formatAmount = (amount: number): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight="medium">
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatAmount(spent)} / {formatAmount(budget)} ({percentage.toFixed(0)}%)
        </Typography>
      </Box>
      <StyledLinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        progressColor={getProgressColor()}
      />
    </Box>
  );
};
