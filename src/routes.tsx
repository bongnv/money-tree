import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TransactionsPage } from './components/transactions/TransactionsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { BudgetsPage } from './components/budgets/BudgetsPage';
import { NotFoundPage } from './components/common/NotFoundPage';

// Settings pages (to be implemented in Phase 9.3)
// import { SettingsLayout } from './components/settings/SettingsLayout';
// import { SettingsPage } from './components/settings/SettingsPage';
// import { AssetsPage } from './components/settings/AssetsPage';
// import { CategoriesPage } from './components/categories/CategoriesPage';

// Temporary direct routes (will be moved under /settings in Phase 9.3)
import { AccountsPage } from './components/accounts/AccountsPage';
import { CategoriesPage } from './components/categories/CategoriesPage';
import { ManualAssetsPage } from './components/assets/ManualAssetsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Main routes */}
      <Route path="/" element={<DashboardPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/budgets" element={<BudgetsPage />} />

      {/* Temporary routes - will be reorganized under /settings in Phase 9.3 */}
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/assets" element={<ManualAssetsPage />} />

      {/* Settings routes - to be implemented in Phase 9.3 */}
      {/* <Route path="/settings" element={<SettingsLayout />}>
        <Route index element={<SettingsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
      </Route> */}

      {/* 404 - Not Found */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
