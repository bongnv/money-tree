import React from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { Box, Alert } from '@mui/material';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { useFinancialSummary } from '@/hooks/dashboard/useFinancialSummary';
import type { PeriodOption } from '../common/PeriodSelector';
import { formatCurrency } from '../../utils/currency.utils';
import { useBaseCurrency } from '../../hooks/useSyncMetadata';

export interface FinancialSummaryProps {
  period: PeriodOption;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ period }) => {
  const navigate = useNavigate();
  const baseCurrency = useBaseCurrency();

  const {
    netWorth,
    cashFlow,
    savingsRate,
    budgetHealth,
    error: errorMessage,
  } = useFinancialSummary(period);

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
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Net Worth"
            value={formatCurrency(netWorth, baseCurrency)}
            onClick={() => navigate('/reports/balance-sheet')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Cash Flow"
            value={formatCurrency(cashFlow, baseCurrency)}
            color={cashFlow >= 0 ? 'success' : 'error'}
            onClick={() => navigate('/reports/cash-flow')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Savings Rate"
            value={`${savingsRate.toFixed(1)}%`}
            color={getSavingsRateColor()}
            onClick={() => navigate('/reports/cash-flow')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Budget Health"
            value={`${budgetHealth.toFixed(0)}%`}
            color={getBudgetHealthColor()}
            onClick={() => navigate('/reports/budget-performance')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
