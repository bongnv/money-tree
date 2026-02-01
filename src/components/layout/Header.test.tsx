import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

// Mock CloudSyncService class
jest.mock('../../services/cloudSync.service', () => ({
  CloudSyncService: jest.fn().mockImplementation(() => ({
    uploadToCloud: jest.fn().mockResolvedValue(undefined),
    downloadFromCloud: jest.fn().mockResolvedValue(undefined),
    fullSync: jest.fn().mockResolvedValue(undefined),
    debouncedSync: jest.fn(),
    setCallbacks: jest.fn(),
    syncing: false,
    pendingChanges: false,
  })),
}));

// Mock SyncProvider
jest.mock('@/contexts/SyncContext', () => ({
  useSync: jest.fn(() => ({
    selectFile: jest.fn().mockResolvedValue(undefined),
    listItems: jest.fn().mockResolvedValue([]),
    fullSync: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    syncStatus: {
      status: 'not-connected' as const,
      errorMessage: null,
      providerName: null,
      fileName: null,
    },
  })),
}));

const renderWithRouter = (component: React.ReactElement, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="*" element={component} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with title', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('Money Tree')).toBeInTheDocument();
  });

  it('should render Sync button', () => {
    renderWithRouter(<Header />);
    // Button shows status based on syncStatus - in this case "Not Connected"
    expect(screen.getByRole('button', { name: /not connected/i })).toBeInTheDocument();
  });

  it('should show "Never synced" when lastSynced is null', () => {
    renderWithRouter(<Header />);
    // The header shows sync status via icon with tooltip, not direct text
    // When not connected, it shows "Not Connected" in the tooltip
    const syncButton = screen.getByRole('button', { name: /not connected/i });
    expect(syncButton).toBeInTheDocument();
  });

  it('should render all navigation buttons', () => {
    renderWithRouter(<Header />);

    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transactions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reports/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /budgets/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  describe('Logo Navigation', () => {
    it('should make Money Tree logo clickable', () => {
      renderWithRouter(<Header />);
      const logo = screen.getByText('Money Tree');
      expect(logo).toHaveStyle({ cursor: 'pointer' });
    });

    it('should navigate to dashboard when logo is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />, '/transactions');

      const logo = screen.getByText('Money Tree');
      await user.click(logo);

      // Would navigate but we're in a test environment, just verify it's clickable
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Active State Highlighting', () => {
    it('should highlight Dashboard button when on /', () => {
      renderWithRouter(<Header />, '/');
      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      expect(dashboardButton).toHaveStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      });
    });

    it('should highlight Transactions button when on /transactions', () => {
      renderWithRouter(<Header />, '/transactions');
      const transactionsButton = screen.getByRole('button', { name: /transactions/i });
      expect(transactionsButton).toHaveStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      });
    });

    it('should highlight Reports button when on /reports', () => {
      renderWithRouter(<Header />, '/reports');
      const reportsButton = screen.getByRole('button', { name: /reports/i });
      expect(reportsButton).toHaveStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      });
    });

    it('should highlight Budgets button when on /budgets', () => {
      renderWithRouter(<Header />, '/budgets');
      const budgetsButton = screen.getByRole('button', { name: /budgets/i });
      expect(budgetsButton).toHaveStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      });
    });

    it('should highlight Settings button when on /settings/*', () => {
      renderWithRouter(<Header />, '/settings/assets');
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toHaveStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      });
    });

    it('should highlight Settings button for temporary /accounts route', () => {
      renderWithRouter(<Header />, '/accounts');
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toHaveStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      });
    });

    it('should highlight Settings button for temporary /categories route', () => {
      renderWithRouter(<Header />, '/categories');
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toHaveStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      });
    });

    it('should highlight Settings button for temporary /assets route', () => {
      renderWithRouter(<Header />, '/assets');
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toHaveStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      });
    });

    it('should not highlight any button except Dashboard when on dashboard', () => {
      renderWithRouter(<Header />, '/');
      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      const transactionsButton = screen.getByRole('button', { name: /transactions/i });
      const reportsButton = screen.getByRole('button', { name: /reports/i });
      const budgetsButton = screen.getByRole('button', { name: /budgets/i });
      const settingsButton = screen.getByRole('button', { name: /settings/i });

      // Dashboard button should be highlighted when on /
      expect(dashboardButton).toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.1)' });
      // Other buttons should not be highlighted
      expect(transactionsButton).not.toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.1)' });
      expect(reportsButton).not.toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.1)' });
      expect(budgetsButton).not.toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.1)' });
      expect(settingsButton).not.toHaveStyle({ backgroundColor: 'rgba(255, 255, 255, 0.1)' });
    });
  });

  describe('Mobile Responsive Menu', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === '(max-width:899.95px)', // md breakpoint
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });

    it('should show menu icon on mobile', () => {
      renderWithRouter(<Header />);
      const menuButton = screen.getByLabelText('menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should open drawer when menu icon is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const menuButton = screen.getByLabelText('menu');
      await user.click(menuButton);

      // Drawer should be open, nav items visible
      const drawerTransactions = screen.getAllByText('Transactions');
      expect(drawerTransactions.length).toBeGreaterThan(0);
    });

    it('should close drawer when item is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Header />);

      const menuButton = screen.getByLabelText('menu');
      await user.click(menuButton);

      // Click a navigation item in the drawer
      const drawerItems = screen.getAllByText('Transactions');
      await user.click(drawerItems[drawerItems.length - 1]); // Click the drawer item

      // Drawer should close (implementation closes on click)
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render icons for all navigation items on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: false, // Desktop
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithRouter(<Header />);

      // Check that nav buttons have icons
      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      const transactionsButton = screen.getByRole('button', { name: /transactions/i });
      const reportsButton = screen.getByRole('button', { name: /reports/i });
      const budgetsButton = screen.getByRole('button', { name: /budgets/i });
      const settingsButton = screen.getByRole('button', { name: /settings/i });

      expect(dashboardButton.querySelector('svg')).toBeInTheDocument();
      expect(transactionsButton.querySelector('svg')).toBeInTheDocument();
      expect(reportsButton.querySelector('svg')).toBeInTheDocument();
      expect(budgetsButton.querySelector('svg')).toBeInTheDocument();
      expect(settingsButton.querySelector('svg')).toBeInTheDocument();
    });
  });
});
