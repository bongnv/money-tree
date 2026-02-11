/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useBalanceSheet } from './useBalanceSheet';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode } from '@/types/enums';
import type { Account, ManualAsset } from '@/types/models';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext', () => ({
  useCalculationService: jest.fn(() => ({
    calculateAccountBalance: jest.fn(() => 1000),
  })),
  useReportService: jest.fn(() => ({
    calculateBalanceSheet: jest.fn(() => ({
      assets: { accounts: 1000, manualAssets: 10000, total: 11000 },
      liabilities: { total: 0 },
      netWorth: 11000,
    })),
  })),
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('useBalanceSheet', () => {
  const mockAccount: Account = {
    id: 'acc-1',
    name: 'Checking',
    type: 'bank_account' as any,
    currencyCode: CurrencyCode.USD,
    initialBalance: 1000,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockAsset: ManualAsset = {
    id: 'asset-1',
    name: 'Investment',
    type: 'stocks_and_shares' as any,
    currencyCode: CurrencyCode.USD,
    valueHistory: [{ date: '2024-01-01', value: 10000 }],
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate balance sheet', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      assets: [mockAsset],
      transactions: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    const { result } = renderHook(() => useBalanceSheet());

    expect(result.current.balanceSheet).toBeDefined();
    expect(result.current.isLoadingBalanceSheet).toBe(false);
  });

  it('should allow changing conversion currency', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      assets: [mockAsset],
      transactions: [],
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
      exchangeRatesMap: new Map(),
      isStoreLoaded: true,
    } as any);

    const { result } = renderHook(() => useBalanceSheet());

    act(() => {
      result.current.setConversionCurrency(CurrencyCode.AUD);
    });

    expect(result.current.conversionCurrency).toBe(CurrencyCode.AUD);
  });

  it('should handle undefined data', () => {
    mockUseStore.mockReturnValue({
      accounts: undefined,
      assets: undefined,
      transactions: undefined,
      baseCurrency: CurrencyCode.USD,
      exchangeRates: [],
      exchangeRatesMap: undefined,
      isStoreLoaded: false,
    } as any);

    const { result } = renderHook(() => useBalanceSheet());

    expect(result.current.isLoadingBalanceSheet).toBe(true);
  });
});
