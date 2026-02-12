/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BalanceSheet } from './BalanceSheet';
import { useBalanceSheet } from '@/hooks/reports/useBalanceSheet';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode } from '@/types/enums';

jest.mock('@/hooks/reports/useBalanceSheet');
jest.mock('@/contexts/StoreContext');

const mockUseBalanceSheet = useBalanceSheet as jest.MockedFunction<typeof useBalanceSheet>;
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('BalanceSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      assets: [],
      accounts: [],
      transactions: [],
      exchangeRatesMap: new Map(),
      updateAsset: jest.fn(),
    } as any);
  });

  it('should render loading state when no balance sheet data', () => {
    mockUseBalanceSheet.mockReturnValue({
      balanceSheet: null,
      netWorthTrend: [],
      comparison: null,
      reportDate: '2024-01-31',
      setReportDate: jest.fn(),
      setComparisonType: jest.fn(),
      conversionCurrency: CurrencyCode.USD,
      setConversionCurrency: jest.fn(),
      isLoadingBalanceSheet: false,
      assets: [],
    } as any);

    renderWithRouter(<BalanceSheet />);

    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
  });

  it('should render balance sheet with data and account balances', () => {
    mockUseBalanceSheet.mockReturnValue({
      balanceSheet: {
        totalAssets: 50000,
        totalLiabilities: 10000,
        netWorth: 40000,
        accountBalances: [
          {
            accountId: 'acc-1',
            accountName: 'Checking',
            balance: 15000,
            currencyCode: CurrencyCode.USD,
          },
        ],
        assets: [],
        liabilities: [],
      },
      netWorthTrend: [
        { date: '2024-01-01', value: 38000 },
        { date: '2024-01-31', value: 40000 },
      ],
      comparison: null,
      reportDate: '2024-01-31',
      setReportDate: jest.fn(),
      setComparisonType: jest.fn(),
      conversionCurrency: CurrencyCode.USD,
      setConversionCurrency: jest.fn(),
      isLoadingBalanceSheet: false,
      assets: [],
    } as any);

    renderWithRouter(<BalanceSheet />);

    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
  });

  it('should render comparison data when available', () => {
    mockUseBalanceSheet.mockReturnValue({
      balanceSheet: {
        totalAssets: 50000,
        totalLiabilities: 10000,
        netWorth: 40000,
        accountBalances: [],
        assets: [],
        liabilities: [],
      },
      netWorthTrend: [],
      comparison: {
        current: { totalAssets: 50000, totalLiabilities: 10000 },
        previous: { totalAssets: 45000, totalLiabilities: 10000 },
        change: 5000,
        changePercent: 14.3,
      },
      reportDate: '2024-01-31',
      setReportDate: jest.fn(),
      setComparisonType: jest.fn(),
      conversionCurrency: CurrencyCode.USD,
      setConversionCurrency: jest.fn(),
      isLoadingBalanceSheet: false,
      assets: [],
    } as any);

    renderWithRouter(<BalanceSheet />);

    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
  });
});
