import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export interface FinancialSummaryCardProps {
  title: string;
  value: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
    label: string;
  };
  color?: 'success' | 'warning' | 'error' | 'default';
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  title,
  value,
  trend,
  color = 'default',
}) => {
  const getColorValue = () => {
    switch (color) {
      case 'success':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" color={getColorValue()} sx={{ mb: 1 }}>
          {value}
        </Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {trend.direction === 'up' ? (
              <TrendingUp fontSize="small" color={color === 'error' ? 'error' : 'success'} />
            ) : (
              <TrendingDown fontSize="small" color={color === 'error' ? 'success' : 'error'} />
            )}
            <Typography variant="body2" color="text.secondary">
              {trend.percentage.toFixed(1)}% {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
