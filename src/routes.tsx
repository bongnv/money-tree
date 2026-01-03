import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TransactionsPage } from './components/transactions/TransactionsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { BudgetsPage } from './components/budgets/BudgetsPage';
import { NotFoundPage } from './components/common/NotFoundPage';

// Settings pages
import { SettingsLayout } from './components/settings/SettingsLayout';
import { SettingsPage } from './components/settings/SettingsPage';
import { AssetsPage } from './components/settings/AssetsPage';
import { CategoriesPage } from './components/categories/CategoriesPage';
import { DataSyncSettings } from './components/settings/DataSyncSettings';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Main routes */}
      <Route path="/" element={<DashboardPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/budgets" element={<BudgetsPage />} />

      {/* Settings routes */}
      <Route path="/settings" element={<SettingsLayout />}>
        <Route index element={<SettingsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="data-sync" element={<DataSyncSettings />} />
      </Route>

      {/* 404 - Not Found */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
