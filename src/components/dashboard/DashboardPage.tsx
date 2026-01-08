import React, { useState, useMemo } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { PeriodSelector } from '../common/PeriodSelector';
import { FinancialSummary } from './FinancialSummary';
import { BudgetOverview } from './BudgetOverview';
import { RecentTransactionsList } from './RecentTransactionsList';

export const DashboardPage: React.FC = () => {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const selectedPeriod = useMemo(
    () => ({ startDate, endDate, label: 'This Month', value: 'this-month' }),
    [startDate, endDate]
  );

  const handlePeriodChange = (range: { startDate: string; endDate: string }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <PeriodSelector
          startDate={startDate}
          endDate={endDate}
          onChange={handlePeriodChange}
          allowCustom={false}
          size="small"
        />
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
