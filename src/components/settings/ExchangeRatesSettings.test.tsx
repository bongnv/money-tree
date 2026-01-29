import { render, screen, fireEvent } from '@testing-library/react';
import { ExchangeRatesSettings } from './ExchangeRatesSettings';
import { AppProvider } from '../../contexts/AppContext';
import type { ExchangeRate } from '../../types/models';
import { useExchangeRates } from '../../hooks/queries/useExchangeRates';

// Mock exchange rates hook

// Mock cloudSync service
jest.mock('../../services/cloudSync.service', () => ({
  getCloudSyncService: jest.fn(() => ({
    fullSync: jest.fn().mockResolvedValue(undefined),
    debouncedSync: jest.fn(),
  })),
  initCloudSyncService: jest.fn(),
}));

const renderComponent = () =>
  render(
    <AppProvider>
      <ExchangeRatesSettings />
    </AppProvider>
  );

describe('ExchangeRatesSettings', () => {
  const currentYear = new Date().getFullYear();

  const mockRates: ExchangeRate[] = [
    {
      id: 'rate-1',
      fromCurrency: 'EUR',
      toCurrency: 'USD',
      rate: 1.0876,
      month: `${currentYear}-01`,
      source: 'exchangerate-api.com',
      fetchedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: 'rate-2',
      fromCurrency: 'EUR',
      toCurrency: 'USD',
      rate: 1.0923,
      month: `${currentYear}-02`,
      source: 'exchangerate-api.com',
      fetchedAt: '2024-02-15T00:00:00Z',
    },
    {
      id: 'rate-3',
      fromCurrency: 'GBP',
      toCurrency: 'USD',
      rate: 1.2634,
      month: `${currentYear}-01`,
      source: 'exchangerate-api.com',
      fetchedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: 'rate-4',
      fromCurrency: 'EUR',
      toCurrency: 'USD',
      rate: 1.0812,
      month: `${currentYear - 1}-12`,
      source: 'exchangerate-api.com',
      fetchedAt: '2023-12-15T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseExchangeRates.mockReturnValue(mockRates);
  });

  describe('Initial Render', () => {
    it('should render the page title', () => {
      renderComponent();

      expect(screen.getByRole('heading', { name: 'Exchange Rates' })).toBeInTheDocument();
    });

    it('should render year selector with current year selected', () => {
      renderComponent();

      const yearSelect = screen.getByRole('combobox');
      expect(yearSelect).toBeInTheDocument();
      expect(yearSelect).toHaveTextContent(String(currentYear));
    });

    it('should render year options (previous, current, next)', () => {
      renderComponent();

      const yearSelect = screen.getByRole('combobox');
      fireEvent.mouseDown(yearSelect);

      // Check for menu items - there will be duplicates with the select value
      const yearOptions = screen.getAllByText(String(currentYear));
      expect(yearOptions.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('option', { name: String(currentYear - 1) })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: String(currentYear + 1) })).toBeInTheDocument();
    });

    it('should display info text about base currency', () => {
      renderComponent();

      expect(
        screen.getByText(/Exchange rates to USD are automatically fetched/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/base currency \(USD\)/i)).toBeInTheDocument();
    });
  });

  describe('Exchange Rates Display', () => {
    it('should display exchange rate table with data', () => {
      renderComponent();

      expect(screen.getByText('EUR → USD')).toBeInTheDocument();
      expect(screen.getByText('GBP → USD')).toBeInTheDocument();
    });

    it('should display rates in correct format (4 decimal places)', () => {
      renderComponent();

      expect(screen.getByText('1.0876')).toBeInTheDocument();
      expect(screen.getByText('1.0923')).toBeInTheDocument();
      expect(screen.getByText('1.2634')).toBeInTheDocument();
    });

    it('should display "-" for months without data', () => {
      renderComponent();

      // There should be many cells with "-" since we only have data for Jan and Feb
      const emptyCells = screen.getAllByText('-');
      expect(emptyCells.length).toBeGreaterThan(10);
    });

    it('should display month headers (abbreviated)', () => {
      renderComponent();

      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Feb')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
      expect(screen.getByText('Dec')).toBeInTheDocument();
    });

    it('should display currency pairs in uppercase', () => {
      renderComponent();

      expect(screen.getByText('EUR → USD')).toBeInTheDocument();
      expect(screen.getByText('GBP → USD')).toBeInTheDocument();
    });
  });

  describe('Year Selection', () => {
    it('should filter rates by selected year', async () => {
      renderComponent();

      // Initially showing current year
      expect(screen.getByText('1.0876')).toBeInTheDocument();
      expect(screen.getByText('1.0923')).toBeInTheDocument();

      // Change to previous year
      const yearSelect = screen.getByRole('combobox');
      fireEvent.mouseDown(yearSelect);
      fireEvent.click(screen.getByText(String(currentYear - 1)));

      // Should show last year's rate
      expect(screen.getByText('1.0812')).toBeInTheDocument();
      // Current year rates should not be visible
      expect(screen.queryByText('1.0876')).not.toBeInTheDocument();
    });

    it('should show info message when no rates for selected year', async () => {
      renderComponent();

      // Change to next year (which has no rates)
      const yearSelect = screen.getByRole('combobox');
      fireEvent.mouseDown(yearSelect);
      const nextYearOption = await screen.findByRole('option', { name: String(currentYear + 1) });
      fireEvent.click(nextYearOption);

      expect(screen.getByText(/No exchange rates to USD found for/i)).toBeInTheDocument();
      // The year appears both in select and alert - check the alert specifically
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(String(currentYear + 1));
    });

    it('should update displayed rates when year changes', async () => {
      renderComponent();

      // Current year should have rates
      expect(screen.getByText('EUR → USD')).toBeInTheDocument();

      // Change to next year
      const yearSelect = screen.getByRole('combobox');
      fireEvent.mouseDown(yearSelect);
      const nextYearOption = await screen.findByText(String(currentYear + 1));
      fireEvent.click(nextYearOption);

      // Should show no rates message
      expect(screen.getByText(/No exchange rates to USD found/i)).toBeInTheDocument();
      expect(screen.queryByText('EUR → USD')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Currency Pairs', () => {
    it('should display multiple currency pairs in separate rows', () => {
      renderComponent();

      expect(screen.getByText('EUR → USD')).toBeInTheDocument();
      expect(screen.getByText('GBP → USD')).toBeInTheDocument();
    });

    it('should display rates for each currency pair correctly', () => {
      renderComponent();

      // EUR → USD rates
      expect(screen.getByText('1.0876')).toBeInTheDocument(); // Jan
      expect(screen.getByText('1.0923')).toBeInTheDocument(); // Feb

      // GBP → USD rate
      expect(screen.getByText('1.2634')).toBeInTheDocument(); // Jan
    });
  });

  describe('Base Currency Display', () => {
    it('should display base currency in info text', () => {
      renderComponent();

      expect(screen.getByText(/base currency \(USD\)/i)).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show info message when no rates at all', () => {
      mockUseExchangeRates.mockReturnValue([]);
      renderComponent();

      expect(screen.getByText(/No exchange rates to USD found/i)).toBeInTheDocument();
      expect(screen.getByText(/Rates will be automatically fetched/i)).toBeInTheDocument();
    });
  });

  describe('Rate Grouping', () => {
    it('should group rates by currency pair and month', () => {
      renderComponent();

      // EUR → USD should have rates for Jan and Feb
      const eurRow = screen.getByText('EUR → USD').closest('tr');
      expect(eurRow).toBeInTheDocument();

      // Should have Jan rate (1.0876) and Feb rate (1.0923) in the same row
      const cells = eurRow?.querySelectorAll('td');
      expect(cells).toBeDefined();
    });

    it('should handle multiple rates for different currency pairs in same month', () => {
      renderComponent();

      // Both EUR and GBP should have Jan rates
      expect(screen.getByText('EUR → USD')).toBeInTheDocument();
      expect(screen.getByText('GBP → USD')).toBeInTheDocument();
      expect(screen.getByText('1.0876')).toBeInTheDocument(); // EUR Jan
      expect(screen.getByText('1.2634')).toBeInTheDocument(); // GBP Jan
    });
  });

  describe('Month Display', () => {
    it('should display all 12 months in the header', () => {
      renderComponent();

      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      months.forEach((month) => {
        expect(screen.getByText(month)).toBeInTheDocument();
      });
    });

    it('should align month columns with rate data', () => {
      renderComponent();

      // Find the table and verify structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Verify month headers exist
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(13); // Currency Pair + 12 months
    });
  });

  describe('Rate Formatting', () => {
    it('should format rates to 4 decimal places', () => {
      const ratesWithVariousDecimals: ExchangeRate[] = [
        {
          id: 'rate-decimal-1',
          fromCurrency: 'JPY',
          toCurrency: 'USD',
          rate: 0.0089123456,
          month: `${currentYear}-01`,
          source: 'exchangerate-api.com',
          fetchedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: 'rate-decimal-2',
          fromCurrency: 'CHF',
          toCurrency: 'USD',
          rate: 1.1,
          month: `${currentYear}-01`,
          source: 'exchangerate-api.com',
          fetchedAt: '2024-01-15T00:00:00Z',
        },
      ];

      mockUseExchangeRates.mockReturnValue(ratesWithVariousDecimals);
      renderComponent();

      expect(screen.getByText('0.0089')).toBeInTheDocument(); // Rounded to 4 decimals
      expect(screen.getByText('1.1000')).toBeInTheDocument(); // Padded to 4 decimals
    });
  });
});
