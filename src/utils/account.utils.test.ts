/* eslint-disable @typescript-eslint/no-explicit-any */
import { validateAccountForm, transformFormToAccount } from './account.utils';
import { AccountType, CurrencyCode } from '@/types/enums';
import type { AccountFormData } from './account.utils';

describe('account.utils', () => {
  describe('validateAccountForm', () => {
    const validFormData: AccountFormData = {
      name: 'Checking Account',
      type: AccountType.BANK_ACCOUNT,
      currencyCode: CurrencyCode.USD,
      initialBalance: '1000',
      description: 'My checking account',
      isActive: true,
    };

    it('should return no errors for valid form data', () => {
      const errors = validateAccountForm(validFormData);
      expect(errors).toEqual([]);
    });

    it('should return error when name is empty', () => {
      const formData = { ...validFormData, name: '' };
      const errors = validateAccountForm(formData);
      expect(errors).toContainEqual({
        field: 'name',
        message: 'Account name is required',
      });
    });

    it('should return error when name is only whitespace', () => {
      const formData = { ...validFormData, name: '   ' };
      const errors = validateAccountForm(formData);
      expect(errors).toContainEqual({
        field: 'name',
        message: 'Account name is required',
      });
    });

    it('should return error when type is missing', () => {
      const formData = { ...validFormData, type: '' as any };
      const errors = validateAccountForm(formData);
      expect(errors).toContainEqual({
        field: 'type',
        message: 'Account type is required',
      });
    });

    it('should return error when currencyCode is missing', () => {
      const formData = { ...validFormData, currencyCode: '' as any };
      const errors = validateAccountForm(formData);
      expect(errors).toContainEqual({
        field: 'currencyCode',
        message: 'Currency is required',
      });
    });

    it('should return error when initialBalance is not a valid number', () => {
      const formData = { ...validFormData, initialBalance: 'invalid' };
      const errors = validateAccountForm(formData);
      expect(errors).toContainEqual({
        field: 'initialBalance',
        message: 'Initial balance must be a valid number',
      });
    });

    it('should accept negative initial balance', () => {
      const formData = { ...validFormData, initialBalance: '-100' };
      const errors = validateAccountForm(formData);
      expect(errors).toEqual([]);
    });

    it('should accept zero initial balance', () => {
      const formData = { ...validFormData, initialBalance: '0' };
      const errors = validateAccountForm(formData);
      expect(errors).toEqual([]);
    });

    it('should return multiple errors when multiple fields are invalid', () => {
      const formData: AccountFormData = {
        name: '',
        type: '' as any,
        currencyCode: '' as any,
        initialBalance: 'invalid',
        isActive: true,
      };
      const errors = validateAccountForm(formData);
      expect(errors.length).toBe(4);
    });
  });

  describe('transformFormToAccount', () => {
    it('should transform valid form data to Account entity', () => {
      const formData: AccountFormData = {
        name: 'Savings Account',
        type: AccountType.INVESTMENT,
        currencyCode: CurrencyCode.AUD,
        initialBalance: '5000.50',
        description: 'Emergency fund',
        isActive: true,
      };

      const result = transformFormToAccount(formData);

      expect(result).toEqual({
        name: 'Savings Account',
        type: AccountType.INVESTMENT,
        currencyCode: CurrencyCode.AUD,
        initialBalance: 5000.5,
        description: 'Emergency fund',
        isActive: true,
        isDeleted: false,
      });
    });

    it('should trim name', () => {
      const formData: AccountFormData = {
        name: '  Checking  ',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '100',
        isActive: true,
      };

      const result = transformFormToAccount(formData);

      expect(result.name).toBe('Checking');
    });

    it('should trim description if provided', () => {
      const formData: AccountFormData = {
        name: 'Account',
        type: AccountType.CASH,
        currencyCode: CurrencyCode.SGD,
        initialBalance: '100',
        description: '  Some description  ',
        isActive: true,
      };

      const result = transformFormToAccount(formData);

      expect(result.description).toBe('Some description');
    });

    it('should set description to undefined if empty after trim', () => {
      const formData: AccountFormData = {
        name: 'Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '100',
        description: '   ',
        isActive: true,
      };

      const result = transformFormToAccount(formData);

      expect(result.description).toBeUndefined();
    });

    it('should set description to undefined if not provided', () => {
      const formData: AccountFormData = {
        name: 'Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '100',
        isActive: false,
      };

      const result = transformFormToAccount(formData);

      expect(result.description).toBeUndefined();
    });

    it('should parse initialBalance as float', () => {
      const formData: AccountFormData = {
        name: 'Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '123.45',
        isActive: true,
      };

      const result = transformFormToAccount(formData);

      expect(result.initialBalance).toBe(123.45);
      expect(typeof result.initialBalance).toBe('number');
    });

    it('should always set isDeleted to false', () => {
      const formData: AccountFormData = {
        name: 'Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '100',
        isActive: true,
      };

      const result = transformFormToAccount(formData);

      expect(result.isDeleted).toBe(false);
    });
  });
});
