import { renderHook, waitFor } from '@testing-library/react';
import { useBudgets, useBudget } from './useBudgets';
import { useBudgetService } from './useServices';
import type { Budget } from '../types/models';
import { BudgetPeriod } from '../types/enums';

// Mock the dependencies
jest.mock('./useServices');
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn((queryFn) => {
    // Execute the query function immediately for testing
    const result = queryFn();
    return result instanceof Promise ? undefined : result;
  }),
}));

const mockUseBudgetService = useBudgetService as jest.MockedFunction<typeof useBudgetService>;

describe('useBudgets', () => {
  const mockBudget: Budget = {
    id: 'budget-1',
    period: BudgetPeriod.MONTHLY,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    transactionTypeId: 'type-1',
    amount: 1000,
    currencyCode: 'USD' as any,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockBudgetService = {
    getActive: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBudgetService.mockReturnValue(mockBudgetService as any);
  });

  describe('useBudgets', () => {
    it('should return active budgets', async () => {
      mockBudgetService.getActive.mockResolvedValue([mockBudget]);

      renderHook(() => useBudgets());

      await waitFor(() => {
        expect(mockBudgetService.getActive).toHaveBeenCalled();
      });
    });

    it('should return undefined initially', () => {
      const { result } = renderHook(() => useBudgets());
      expect(result.current).toBeUndefined();
    });
  });

  describe('useBudget', () => {
    it('should return budget by id', async () => {
      mockBudgetService.getById.mockResolvedValue(mockBudget);

      renderHook(() => useBudget('budget-1'));

      await waitFor(() => {
        expect(mockBudgetService.getById).toHaveBeenCalledWith('budget-1');
      });
    });

    it('should return undefined when id is not provided', () => {
      const { result } = renderHook(() => useBudget(undefined));
      expect(result.current).toBeUndefined();
    });

    it('should update when id changes', async () => {
      mockBudgetService.getById.mockResolvedValue(mockBudget);

      const { rerender } = renderHook(({ id }) => useBudget(id), {
        initialProps: { id: 'budget-1' },
      });

      await waitFor(() => {
        expect(mockBudgetService.getById).toHaveBeenCalledWith('budget-1');
      });

      mockBudgetService.getById.mockClear();
      rerender({ id: 'budget-2' });

      await waitFor(() => {
        expect(mockBudgetService.getById).toHaveBeenCalledWith('budget-2');
      });
    });
  });
});
