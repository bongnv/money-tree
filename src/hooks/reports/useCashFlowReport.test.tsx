/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useCashFlowReport } from './useCashFlowReport';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode } from '@/types/enums';
import type { Account } from '@/types/models';

jest.mock('@/contexts/StoreContext');
jest.mock('../useServices', () => ({
  useCalculationService: jest.fn(() => ({})),
  useReportService: jest.fn(() => ({
    calculateCashFlow: jest.fn(() => ({ income: 5000, expenses: 3000, netCashFlow: 2000 })),
  })),
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('useCashFlowReport', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate cash flow report', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      transactionTypes: [],
      categories: [],
      baseCurrency: CurrencyCode.USD,
    } as any);

    const { result } = renderHook(() => useCashFlowReport());

    expect(result.current.cashFlow).toBeDefined();
    expect(result.current.startDate).toBeDefined();
    expect(result.current.endDate).toBeDefined();
  });

  it('should allow changing date range', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      transactionTypes: [],
      categories: [],
      baseCurrency: CurrencyCode.USD,
    } as any);

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setStartDate('2024-06-01');
      result.current.setEndDate('2024-06-30');
    });

    expect(result.current.startDate).toBe('2024-06-01');
    expect(result.current.endDate).toBe('2024-06-30');
  });

  it('should allow changing conversion currency', () => {
    mockUseStore.mockReturnValue({
      accounts: [mockAccount],
      transactions: [],
      transactionTypes: [],
      categories: [],
      baseCurrency: CurrencyCode.USD,
    } as any);

    const { result } = renderHook(() => useCashFlowReport());

    act(() => {
      result.current.setConversionCurrency(CurrencyCode.AUD);
    });

    expect(result.current.conversionCurrency).toBe(CurrencyCode.AUD);
  });

  it('should handle empty data', () => {
    mockUseStore.mockReturnValue({
      accounts: [],
      transactions: [],
      transactionTypes: [],
      categories: [],
      baseCurrency: CurrencyCode.USD,
    } as any);

    const { result } = renderHook(() => useCashFlowReport());

    expect(result.current.cashFlow).toBeDefined();
  });
});
