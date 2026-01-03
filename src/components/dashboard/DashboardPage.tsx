import React, { useState } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { PeriodSelector, PeriodOption } from './PeriodSelector';
import { FinancialSummary } from './FinancialSummary';
import { BudgetOverview } from './BudgetOverview';
import { RecentTransactionsList } from './RecentTransactionsList';

export const DashboardPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>({
    label: 'This Month',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Financial Summary
        </Typography>
        <FinancialSummary period={selectedPeriod} />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Budget Overview
        </Typography>
        <BudgetOverview period={selectedPeriod} />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Transactions
        </Typography>
        <RecentTransactionsList limit={10} />
      </Box>
    </Container>
  );
};
