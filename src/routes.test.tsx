import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './routes';

// Mock all page components
jest.mock('./components/dashboard/DashboardPage', () => ({
  DashboardPage: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

jest.mock('./components/transactions/TransactionsPage', () => ({
  TransactionsPage: () => <div data-testid="transactions-page">Transactions Page</div>,
}));

jest.mock('./components/reports/ReportsPage', () => ({
  ReportsPage: () => <div data-testid="reports-page">Reports Page</div>,
}));

jest.mock('./components/budgets/BudgetsPage', () => ({
  BudgetsPage: () => <div data-testid="budgets-page">Budgets Page</div>,
}));

jest.mock('./components/settings/SettingsLayout', () => ({
  SettingsLayout: () => {
    const { Outlet } = require('react-router-dom');
    return (
      <div data-testid="settings-layout">
        Settings Layout
        <Outlet />
      </div>
    );
  },
}));

jest.mock('./components/settings/SettingsPage', () => ({
  SettingsPage: () => <div data-testid="settings-page">Settings Page</div>,
}));

jest.mock('./components/settings/AssetsPage', () => ({
  AssetsPage: () => <div data-testid="settings-assets-page">Assets Page</div>,
}));

jest.mock('./components/categories/CategoriesPage', () => ({
  CategoriesPage: () => <div data-testid="categories-page">Categories Page</div>,
}));

jest.mock('./components/common/NotFoundPage', () => ({
  NotFoundPage: () => <div data-testid="not-found-page">404 Not Found</div>,
}));

describe('AppRoutes', () => {
  const renderWithRouter = (initialRoute: string) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes />
      </MemoryRouter>
    );
  };

  describe('Main Routes', () => {
    it('renders DashboardPage at / route', () => {
      renderWithRouter('/');
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    it('renders TransactionsPage at /transactions route', () => {
      renderWithRouter('/transactions');
      expect(screen.getByTestId('transactions-page')).toBeInTheDocument();
      expect(screen.getByText('Transactions Page')).toBeInTheDocument();
    });

    it('renders ReportsPage at /reports route', () => {
      renderWithRouter('/reports');
      expect(screen.getByTestId('reports-page')).toBeInTheDocument();
      expect(screen.getByText('Reports Page')).toBeInTheDocument();
    });

    it('renders BudgetsPage at /budgets route', () => {
      renderWithRouter('/budgets');
      expect(screen.getByTestId('budgets-page')).toBeInTheDocument();
      expect(screen.getByText('Budgets Page')).toBeInTheDocument();
    });
  });

  describe('Settings Routes', () => {
    it('renders SettingsPage at /settings route', () => {
      renderWithRouter('/settings');
      expect(screen.getByTestId('settings-layout')).toBeInTheDocument();
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });

    it('renders AssetsPage at /settings/assets route', () => {
      renderWithRouter('/settings/assets');
      expect(screen.getByTestId('settings-layout')).toBeInTheDocument();
      expect(screen.getByTestId('settings-assets-page')).toBeInTheDocument();
    });

    it('renders CategoriesPage at /settings/categories route', () => {
      renderWithRouter('/settings/categories');
      expect(screen.getByTestId('settings-layout')).toBeInTheDocument();
      expect(screen.getByTestId('categories-page')).toBeInTheDocument();
    });
  });

  describe('Old Routes Removed', () => {
    it('redirects /accounts to 404', async () => {
      renderWithRouter('/accounts');
      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });

    it('redirects /assets to 404', async () => {
      renderWithRouter('/assets');
      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });

    it('redirects /categories to 404 (now only at /settings/categories)', async () => {
      renderWithRouter('/categories');
      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });
  });

  describe('404 Not Found', () => {
    it('renders NotFoundPage at /404 route', () => {
      renderWithRouter('/404');
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
    });

    it('redirects to /404 for unknown routes', async () => {
      renderWithRouter('/unknown-route');

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });

    it('redirects to /404 for invalid nested routes', async () => {
      renderWithRouter('/transactions/invalid/nested');

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });

    it('redirects to /404 for misspelled routes', async () => {
      renderWithRouter('/transctions');

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });
  });

  describe('Route Structure', () => {
    it('does not render multiple pages simultaneously', () => {
      renderWithRouter('/transactions');

      expect(screen.getByTestId('transactions-page')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('reports-page')).not.toBeInTheDocument();
    });

    it('renders only the matched route component', () => {
      renderWithRouter('/budgets');

      const allTestIds = ['dashboard-page', 'transactions-page', 'reports-page', 'settings-layout'];

      allTestIds.forEach((testId) => {
        expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('budgets-page')).toBeInTheDocument();
    });
  });
});
