import { validateBudgetForm, transformFormToBudget } from './budget.utils';
import { BudgetPeriod, CurrencyCode } from '@/types/enums';
import type { BudgetFormData } from './budget.utils';

describe('budget.utils', () => {
  describe('validateBudgetForm', () => {
    const validFormData: BudgetFormData = {
      transactionTypeId: 'type-1',
      amount: '1000',
      currencyCode: CurrencyCode.USD,
      period: BudgetPeriod.MONTHLY,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    it('should return no errors for valid form data', () => {
      const errors = validateBudgetForm(validFormData);
      expect(errors).toEqual([]);
    });

    it('should return error when transactionTypeId is missing', () => {
      const formData = { ...validFormData, transactionTypeId: '' };
      const errors = validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'transactionTypeId',
        message: 'Transaction type is required',
      });
    });

    it('should return error when currencyCode is missing', () => {
      const formData = { ...validFormData, currencyCode: '' };
      const errors = validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'currencyCode',
        message: 'Currency is required',
      });
    });

    it('should return error when amount is not a number', () => {
      const formData = { ...validFormData, amount: 'invalid' };
      const errors = validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'amount',
        message: 'Amount must be greater than 0',
      });
    });

    it('should return error when amount is zero', () => {
      const formData = { ...validFormData, amount: '0' };
      const errors = validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'amount',
        message: 'Amount must be greater than 0',
      });
    });

    it('should return error when amount is negative', () => {
      const formData = { ...validFormData, amount: '-100' };
      const errors = validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'amount',
        message: 'Amount must be greater than 0',
      });
    });

    it('should return error when period is missing', () => {
      const formData = { ...validFormData, period: '' };
      const errors = validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'period',
        message: 'Period is required',
      });
    });

    it('should return error when startDate is missing', () => {
      const formData = { ...validFormData, startDate: '' };
      const errors = validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'startDate',
        message: 'Start date is required',
      });
    });

    it('should return error when endDate is missing', () => {
      const formData = { ...validFormData, endDate: '' };
      const errors = validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'endDate',
        message: 'End date is required',
      });
    });

    it('should return error when endDate is before startDate', () => {
      const formData = { ...validFormData, startDate: '2024-12-31', endDate: '2024-01-01' };
      const errors = validateBudgetForm(formData);
      expect(errors).toContainEqual({
        field: 'endDate',
        message: 'End date must be on or after start date',
      });
    });

    it('should return multiple errors when multiple fields are invalid', () => {
      const formData: BudgetFormData = {
        transactionTypeId: '',
        amount: 'invalid',
        currencyCode: '',
        period: '',
        startDate: '',
        endDate: '',
      };
      const errors = validateBudgetForm(formData);
      expect(errors.length).toBeGreaterThan(1);
    });
  });

  describe('transformFormToBudget', () => {
    it('should transform valid form data to Budget entity', () => {
      const formData: BudgetFormData = {
        transactionTypeId: 'type-1',
        amount: '1000.50',
        currencyCode: CurrencyCode.USD,
        period: BudgetPeriod.MONTHLY,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = transformFormToBudget(formData);

      expect(result).toEqual({
        transactionTypeId: 'type-1',
        amount: 1000.5,
        currencyCode: CurrencyCode.USD,
        period: BudgetPeriod.MONTHLY,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    });

    it('should parse amount as float', () => {
      const formData: BudgetFormData = {
        transactionTypeId: 'type-1',
        amount: '500',
        currencyCode: CurrencyCode.AUD,
        period: BudgetPeriod.QUARTERLY,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = transformFormToBudget(formData);

      expect(result.amount).toBe(500);
      expect(typeof result.amount).toBe('number');
    });
  });
});
