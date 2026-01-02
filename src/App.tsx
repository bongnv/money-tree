import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Container } from '@mui/material';
import theme from './theme';
import { MainLayout } from './components/layout/MainLayout';
import { FileLoadErrorDialog } from './components/common/FileLoadErrorDialog';
import { AccountsPage } from './components/accounts/AccountsPage';
import { CategoriesPage } from './components/categories/CategoriesPage';
import { TransactionsPage } from './components/transactions/TransactionsPage';
import { ManualAssetsPage } from './components/assets/ManualAssetsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { BudgetsPage } from './components/budgets/BudgetsPage';
import { PeriodSelector, PeriodOption } from './components/dashboard/PeriodSelector';
import { FinancialSummary } from './components/dashboard/FinancialSummary';
import { BudgetOverview } from './components/dashboard/BudgetOverview';
import { useAppStore } from './stores/useAppStore';
import { syncService } from './services/sync.service';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const DashboardPage: React.FC = () => {
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
    </Container>
  );
};

const App: React.FC = () => {
  const { error, setError, hasUnsavedChanges } = useAppStore();

  useEffect(() => {
    syncService.startAutoSave();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      syncService.stopAutoSave();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/assets" element={<ManualAssetsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
      <FileLoadErrorDialog open={!!error} error={error} onClose={handleCloseError} />
    </ThemeProvider>
  );
};

export default App;
