import { BudgetService } from './budget.service';
import { db } from '../db/database';
import type { Budget } from '../types/models';
import { CurrencyCode, BudgetPeriod } from '../types/enums';
import type { SyncMetadataService } from './syncMetadata.service';

const mockSyncMetadataService = {
  setLastModified: jest.fn(),
} as unknown as SyncMetadataService;

jest.mock('../db/database', () => ({
  db: {
    budgets: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
    },
    syncMetadata: {
      put: jest.fn(),
      get: jest.fn(),
    },
  },
}));

describe('budgetService', () => {
  let budgetService: BudgetService;
  const mockBudget: Budget = {
    id: '1',
    transactionTypeId: '1',
    amount: 1000,
    currencyCode: CurrencyCode.USD,
    period: BudgetPeriod.MONTHLY,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    budgetService = new BudgetService(db, mockSyncMetadataService);
  });

  describe('getAll', () => {
    it('should return all budgets', async () => {
      (db.budgets.toArray as jest.Mock).mockResolvedValue([mockBudget]);

      const result = await budgetService.getAll();

      expect(result).toEqual([mockBudget]);
    });
  });

  describe('getActive', () => {
    it('should return only non-deleted budgets', async () => {
      const mockFilter = {
        toArray: jest.fn().mockResolvedValue([mockBudget]),
      };
      (db.budgets.filter as jest.Mock).mockReturnValue(mockFilter);

      const result = await budgetService.getActive();

      expect(result).toEqual([mockBudget]);
    });
  });

  describe('create', () => {
    it('should create a new budget', async () => {
      const newBudget = {
        transactionTypeId: '2',
        amount: 500,
        currencyCode: CurrencyCode.USD,
        period: BudgetPeriod.MONTHLY,
        startDate: '2024-02-01',
        endDate: '2024-12-31',
      };
      (db.budgets.add as jest.Mock).mockResolvedValue('2');

      const id = await budgetService.create(newBudget);

      expect(typeof id).toBe('string');
      expect(id).toBeTruthy();
      expect(db.budgets.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newBudget,
          isDeleted: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing budget', async () => {
      (db.budgets.get as jest.Mock).mockResolvedValue(mockBudget);
      (db.budgets.update as jest.Mock).mockResolvedValue(1);

      await budgetService.update('1', { amount: 1200 });

      expect(db.budgets.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          amount: 1200,
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if budget not found', async () => {
      (db.budgets.get as jest.Mock).mockResolvedValue(undefined);

      await expect(budgetService.update('999', { amount: 100 })).rejects.toThrow(
        'Budget with id 999 not found'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a budget', async () => {
      (db.budgets.get as jest.Mock).mockResolvedValue(mockBudget);
      (db.budgets.update as jest.Mock).mockResolvedValue(1);

      await budgetService.delete('1');

      expect(db.budgets.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          isDeleted: true,
        })
      );
    });
  });

  describe('validateBudgetForm', () => {
    it('should return no errors for valid form data', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '1000',
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toEqual([]);
    });

    it('should return error for missing transaction type', () => {
      const formData = {
        transactionTypeId: '',
        amount: '1000',
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'transactionTypeId',
        message: 'Transaction type is required',
      });
    });

    it('should return error for missing currency', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '1000',
        currencyCode: '',
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toContainEqual({ field: 'currencyCode', message: 'Currency is required' });
    });

    it('should return error for invalid amount', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: 'not a number',
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toContainEqual({ field: 'amount', message: 'Amount must be greater than 0' });
    });

    it('should return error for zero amount', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '0',
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toContainEqual({ field: 'amount', message: 'Amount must be greater than 0' });
    });

    it('should return error for negative amount', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '-500',
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toContainEqual({ field: 'amount', message: 'Amount must be greater than 0' });
    });

    it('should return error for missing period', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '1000',
        currencyCode: CurrencyCode.USD,
        period: '',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toContainEqual({ field: 'period', message: 'Period is required' });
    });

    it('should return error for missing start date', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '1000',
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '',
        endDate: '2024-12-31',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toContainEqual({ field: 'startDate', message: 'Start date is required' });
    });

    it('should return error for missing end date', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '1000',
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toContainEqual({ field: 'endDate', message: 'End date is required' });
    });

    it('should return error for end date before start date', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '1000',
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'endDate',
        message: 'End date must be on or after start date',
      });
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const formData = {
        transactionTypeId: '',
        amount: '-100',
        currencyCode: '',
        period: 'monthly',
        startDate: '',
        endDate: '',
      };

      const errors = budgetService.validateBudgetForm(formData);
      expect(errors.length).toBe(5);
    });
  });

  describe('transformFormToBudget', () => {
    it('should transform form data to budget object', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '1000.50',
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = budgetService.transformFormToBudget(formData);

      expect(result).toEqual({
        transactionTypeId: 'type-1',
        amount: 1000.5,
        currencyCode: CurrencyCode.USD,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    });

    it('should handle quarterly period', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '5000',
        currencyCode: CurrencyCode.SGD,
        period: 'quarterly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = budgetService.transformFormToBudget(formData);

      expect(result.period).toBe('quarterly');
      expect(result.currencyCode).toBe(CurrencyCode.SGD);
    });

    it('should handle yearly period', () => {
      const formData = {
        transactionTypeId: 'type-1',
        amount: '12000',
        currencyCode: CurrencyCode.AUD,
        period: 'yearly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = budgetService.transformFormToBudget(formData);

      expect(result.period).toBe('yearly');
      expect(result.currencyCode).toBe(CurrencyCode.AUD);
    });
  });
});
