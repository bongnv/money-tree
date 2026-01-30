import { Group, AccountType, BudgetPeriod, CurrencyCode } from './enums';

describe('Enums', () => {
  describe('Group', () => {
    it('should have correct values', () => {
      expect(Group.INCOME).toBe('income');
      expect(Group.EXPENSE).toBe('expense');
      expect(Group.TRANSFER).toBe('transfer');
      expect(Group.ASSET_PURCHASE).toBe('asset_purchase');
      expect(Group.ASSET_SALE).toBe('asset_sale');
    });

    it('should have all expected members', () => {
      const values = Object.values(Group);
      expect(values).toHaveLength(5);
      expect(values).toContain('income');
      expect(values).toContain('expense');
      expect(values).toContain('transfer');
      expect(values).toContain('asset_purchase');
      expect(values).toContain('asset_sale');
    });
  });

  describe('AccountType', () => {
    it('should have correct values', () => {
      expect(AccountType.CASH).toBe('cash');
      expect(AccountType.BANK_ACCOUNT).toBe('bank_account');
      expect(AccountType.CREDIT_CARD).toBe('credit_card');
      expect(AccountType.INVESTMENT).toBe('investment');
      expect(AccountType.LOAN).toBe('loan');
      expect(AccountType.OTHER).toBe('other');
    });

    it('should have all expected members', () => {
      const values = Object.values(AccountType);
      expect(values).toHaveLength(6);
      expect(values).toContain('cash');
      expect(values).toContain('bank_account');
      expect(values).toContain('credit_card');
      expect(values).toContain('investment');
      expect(values).toContain('loan');
      expect(values).toContain('other');
    });
  });

  describe('BudgetPeriod', () => {
    it('should have correct values', () => {
      expect(BudgetPeriod.MONTHLY).toBe('monthly');
      expect(BudgetPeriod.QUARTERLY).toBe('quarterly');
      expect(BudgetPeriod.YEARLY).toBe('yearly');
    });

    it('should have all expected members', () => {
      const values = Object.values(BudgetPeriod);
      expect(values).toHaveLength(3);
      expect(values).toContain('monthly');
      expect(values).toContain('quarterly');
      expect(values).toContain('yearly');
    });
  });

  describe('Currency', () => {
    it('should have correct values', () => {
      expect(CurrencyCode.USD).toBe(CurrencyCode.USD);
      expect(CurrencyCode.VND).toBe('VND');
      expect(CurrencyCode.SGD).toBe('SGD');
      expect(CurrencyCode.AUD).toBe('AUD');
    });

    it('should have all expected members', () => {
      const values = Object.values(CurrencyCode);
      expect(values).toHaveLength(4);
      expect(values).toContain(CurrencyCode.USD);
      expect(values).toContain('VND');
      expect(values).toContain('SGD');
      expect(values).toContain('AUD');
    });
  });
});
