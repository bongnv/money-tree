import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TransactionsPage } from './components/transactions/TransactionsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { BalanceSheet } from './components/reports/BalanceSheet';
import { CashFlowReport } from './components/reports/CashFlowReport';
import { BudgetPerformanceReport } from './components/reports/BudgetPerformanceReport';
import { BudgetsPage } from './components/budgets/BudgetsPage';
import { NotFoundPage } from './components/common/NotFoundPage';

// Settings pages
import { SettingsLayout } from './components/settings/SettingsLayout';
import { PreferencesPage } from './components/settings/PreferencesPage';
import { AssetsSettingsPage } from './components/settings/AssetsSettingsPage';
import { CategoriesListPage } from './components/settings/CategoriesListPage';
import { CategoryDetailPage } from './components/settings/CategoryDetailPage';
import { ExchangeRatesSettingsPage } from './components/settings/ExchangeRatesSettingsPage';
import { ArchivesSettingsPage } from './components/settings/ArchivesSettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Main routes */}
      <Route path="/" element={<DashboardPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/reports" element={<ReportsPage />}>
        <Route index element={<Navigate to="/reports/balance-sheet" replace />} />
        <Route path="balance-sheet" element={<BalanceSheet />} />
        <Route path="cash-flow" element={<CashFlowReport />} />
        <Route path="budget-performance" element={<BudgetPerformanceReport />} />
      </Route>
      <Route path="/budgets" element={<BudgetsPage />} />

      {/* Settings routes */}
      <Route path="/settings" element={<SettingsLayout />}>
        <Route index element={<Navigate to="/settings/preferences" replace />} />
        <Route path="preferences" element={<PreferencesPage />} />
        <Route path="accounts" element={<AssetsSettingsPage />} />
        <Route path="categories" element={<CategoriesListPage />} />
        <Route path="categories/:id" element={<CategoryDetailPage />} />
        <Route path="exchange-rates" element={<ExchangeRatesSettingsPage />} />
        <Route path="archives" element={<ArchivesSettingsPage />} />
      </Route>

      {/* 404 - Not Found */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
