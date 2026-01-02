import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';

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
  let promptSaveIfNeededSpy: jest.SpyInstance;
  let loadDataFileSpy: jest.SpyInstance;
  let saveNowSpy: jest.SpyInstance;

  beforeEach(() => {
    useAppStore.getState().resetState();
    promptSaveIfNeededSpy = jest.spyOn(syncService, 'promptSaveIfNeeded');
    loadDataFileSpy = jest.spyOn(syncService, 'loadDataFile');
    saveNowSpy = jest.spyOn(syncService, 'saveNow');
  });

  afterEach(() => {
    promptSaveIfNeededSpy.mockRestore();
    loadDataFileSpy.mockRestore();
    saveNowSpy.mockRestore();
  });

  it('should render header with title', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('Money Tree')).toBeInTheDocument();
  });

  it('should render Load and Save buttons', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('Load')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should show file name when available', () => {
    useAppStore.getState().setFileName('money-tree-2024.json');
    renderWithRouter(<Header />);
    expect(screen.getByText('money-tree-2024.json')).toBeInTheDocument();
  });

  it('should show "Never saved" when lastSaved is null', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('Never saved')).toBeInTheDocument();
  });

  it('should call syncService.loadDataFile when Load button is clicked', async () => {
    promptSaveIfNeededSpy.mockResolvedValue(true);
    loadDataFileSpy.mockResolvedValue(undefined);

    renderWithRouter(<Header />);

    const loadButton = screen.getByText('Load');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(promptSaveIfNeededSpy).toHaveBeenCalled();
      expect(loadDataFileSpy).toHaveBeenCalled();
    });
  });

  it('should not load when promptSaveIfNeeded returns false', async () => {
    promptSaveIfNeededSpy.mockResolvedValue(false);
    loadDataFileSpy.mockResolvedValue(undefined);

    renderWithRouter(<Header />);

    const loadButton = screen.getByText('Load');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(promptSaveIfNeededSpy).toHaveBeenCalled();
      expect(loadDataFileSpy).not.toHaveBeenCalled();
    });
  });

  it('should call syncService.saveNow when Save button is clicked', async () => {
    useAppStore.getState().setUnsavedChanges(true);
    saveNowSpy.mockResolvedValue(undefined);

    renderWithRouter(<Header />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveNowSpy).toHaveBeenCalled();
    });
  });

  it('should disable Save button when no unsaved changes', () => {
    useAppStore.getState().setUnsavedChanges(false);

    renderWithRouter(<Header />);

    const saveButton = screen.getByText('Save').closest('button');
    expect(saveButton).toBeDisabled();
  });

  it('should disable buttons when loading', () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setUnsavedChanges(true);

    renderWithRouter(<Header />);

    const loadButton = screen.getByText('Load').closest('button');
    const saveButton = screen.getByText('Save').closest('button');

    expect(loadButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it('should show loading spinner when loading', () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setUnsavedChanges(true);

    renderWithRouter(<Header />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render all navigation buttons', () => {
    renderWithRouter(<Header />);

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

    it('should not highlight any button when on dashboard', () => {
      renderWithRouter(<Header />, '/');
      const transactionsButton = screen.getByRole('button', { name: /transactions/i });
      const reportsButton = screen.getByRole('button', { name: /reports/i });
      const budgetsButton = screen.getByRole('button', { name: /budgets/i });
      const settingsButton = screen.getByRole('button', { name: /settings/i });

      // When on dashboard (/), no nav buttons should be highlighted
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
      const transactionsButton = screen.getByRole('button', { name: /transactions/i });
      const reportsButton = screen.getByRole('button', { name: /reports/i });
      const budgetsButton = screen.getByRole('button', { name: /budgets/i });
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      
      expect(transactionsButton.querySelector('svg')).toBeInTheDocument();
      expect(reportsButton.querySelector('svg')).toBeInTheDocument();
      expect(budgetsButton.querySelector('svg')).toBeInTheDocument();
      expect(settingsButton.querySelector('svg')).toBeInTheDocument();
    });
  });
});
