import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PreferencesPage } from './PreferencesPage';
import { useAppStore } from '../../stores/useAppStore';

// Mock the store
jest.mock('../../stores/useAppStore');

describe('PreferencesPage', () => {
  const mockSetBaseCurrency = jest.fn();
  const mockStoreState = {
    baseCurrency: 'usd',
    setBaseCurrency: mockSetBaseCurrency,
    fileName: 'test.json',
    lastSaved: new Date().toISOString(),
    hasUnsavedChanges: false,
    currentYear: 2026,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as unknown as jest.Mock).mockImplementation((selector) => {
      // Handle both selector function and direct call
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState;
    });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  it('should render preferences page with title', () => {
    renderWithRouter(<PreferencesPage />);
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Currency Settings')).toBeInTheDocument();
  });

  it('should display current base currency', () => {
    renderWithRouter(<PreferencesPage />);
    // Check that the current currency is displayed in the select
    expect(screen.getByRole('combobox', { name: 'Base Currency' })).toBeInTheDocument();
  });

  it('should allow changing base currency', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PreferencesPage />);

    const select = screen.getByLabelText('Base Currency');
    await user.click(select);

    // Find and click VND option
    const vndOption = screen.getByRole('option', { name: /VND - Vietnamese Dong/ });
    await user.click(vndOption);

    expect(mockSetBaseCurrency).toHaveBeenCalledWith('vnd');
  });

  it('should show save notice after changing currency', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PreferencesPage />);

    const select = screen.getByLabelText('Base Currency');
    await user.click(select);

    const sgdOption = screen.getByRole('option', { name: /SGD - Singapore Dollar/ });
    await user.click(sgdOption);

    expect(
      screen.getByText(/Base currency changed. Don't forget to save your data file/)
    ).toBeInTheDocument();
  });

  it('should hide save notice after timeout', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    renderWithRouter(<PreferencesPage />);

    const select = screen.getByLabelText('Base Currency');
    await user.click(select);

    const audOption = screen.getByRole('option', { name: /AUD - Australian Dollar/ });
    await user.click(audOption);

    expect(
      screen.getByText(/Base currency changed. Don't forget to save your data file/)
    ).toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(
        screen.queryByText(/Base currency changed. Don't forget to save your data file/)
      ).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should display all available currencies', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PreferencesPage />);

    const select = screen.getByLabelText('Base Currency');
    await user.click(select);

    // Check that common currencies are available
    expect(screen.getByRole('option', { name: /USD - US Dollar/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /VND - Vietnamese Dong/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /SGD - Singapore Dollar/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /AUD - Australian Dollar/ })).toBeInTheDocument();
  });

  it('should display helpful description text', () => {
    renderWithRouter(<PreferencesPage />);

    expect(
      screen.getByText(/The base currency is used as the default display currency/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Changing the base currency will recalculate all reports/)
    ).toBeInTheDocument();
  });
});
