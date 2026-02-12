/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from '@testing-library/react';
import { ExchangeRatesSettings } from './ExchangeRatesSettings';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode } from '@/types/enums';

jest.mock('@/contexts/StoreContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('ExchangeRatesSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render exchange rates title', () => {
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    render(<ExchangeRatesSettings />);

    expect(screen.getByText('Exchange Rates')).toBeInTheDocument();
  });

  it('should show info alert when no rates exist', () => {
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    render(<ExchangeRatesSettings />);

    expect(screen.getByText(/No exchange rates/)).toBeInTheDocument();
  });

  it('should render rate table when rates exist', () => {
    const currentYear = new Date().getFullYear();
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [
        {
          id: 'rate-1',
          month: `${currentYear}-01`,
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.7432,
          createdAt: '',
        },
        {
          id: 'rate-2',
          month: `${currentYear}-02`,
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.751,
          createdAt: '',
        },
      ],
    } as any);

    render(<ExchangeRatesSettings />);

    expect(screen.getByText('Currency Pair')).toBeInTheDocument();
    expect(screen.getByText('0.7432')).toBeInTheDocument();
    expect(screen.getByText('0.7510')).toBeInTheDocument();
  });

  it('should render component without errors', () => {
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    const { container } = render(<ExchangeRatesSettings />);

    // Year selector and exchange rates section should render
    expect(container.querySelector('.MuiSelect-select')).toBeInTheDocument();
  });

  it('should show explanation text', () => {
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
    } as any);

    render(<ExchangeRatesSettings />);

    expect(screen.getByText(/Exchange rates to/)).toBeInTheDocument();
  });

  it('should filter rates by year', () => {
    const currentYear = new Date().getFullYear();
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [
        {
          id: 'rate-1',
          month: `${currentYear - 1}-06`,
          fromCurrency: CurrencyCode.SGD,
          toCurrency: CurrencyCode.USD,
          rate: 0.7,
          createdAt: '',
        },
      ],
    } as any);

    render(<ExchangeRatesSettings />);

    // Rate from previous year shouldn't show in current year view
    expect(screen.queryByText('0.7000')).not.toBeInTheDocument();
  });
});
