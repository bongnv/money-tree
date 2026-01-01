import { renderHook, act } from '@testing-library/react';
import { useAccountStore } from './useAccountStore';
import { useAppStore } from './useAppStore';
import { AccountType } from '../types/enums';
import type { Account } from '../types/models';

describe('useAccountStore', () => {
  const mockAccount: Account = {
    id: 'acc-1',
    name: 'Checking Account',
    type: AccountType.BANK_ACCOUNT,
    currencyId: 'usd',
    initialBalance: 1000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    const { result } = renderHook(() => useAccountStore());
    act(() => {
      result.current.resetAccounts();
    });
    const { result: appResult } = renderHook(() => useAppStore());
    act(() => {
      appResult.current.setUnsavedChanges(false);
    });
  });

  describe('setAccounts', () => {
    it('should set accounts', () => {
      const { result } = renderHook(() => useAccountStore());

      act(() => {
        result.current.setAccounts([mockAccount]);
      });

      expect(result.current.accounts).toHaveLength(1);
      expect(result.current.accounts[0]).toEqual(mockAccount);
    });

    it('should replace existing accounts', () => {
      const { result } = renderHook(() => useAccountStore());

      act(() => {
        result.current.setAccounts([mockAccount]);
      });

      const newAccount: Account = { ...mockAccount, id: 'acc-2', name: 'Savings' };

      act(() => {
        result.current.setAccounts([newAccount]);
      });

      expect(result.current.accounts).toHaveLength(1);
      expect(result.current.accounts[0]).toEqual(newAccount);
    });
  });

  describe('addAccount', () => {
    it('should add a new account', () => {
      const { result } = renderHook(() => useAccountStore());

      act(() => {
        result.current.addAccount(mockAccount);
      });

      expect(result.current.accounts).toHaveLength(1);
      expect(result.current.accounts[0]).toEqual(mockAccount);
    });

    it('should mark changes as unsaved', () => {
      const { result } = renderHook(() => useAccountStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        result.current.addAccount(mockAccount);
      });

      expect(appResult.current.hasUnsavedChanges).toBe(true);
    });

    it('should add multiple accounts', () => {
      const { result } = renderHook(() => useAccountStore());
      const account2: Account = { ...mockAccount, id: 'acc-2', name: 'Savings' };

      act(() => {
        result.current.addAccount(mockAccount);
        result.current.addAccount(account2);
      });

      expect(result.current.accounts).toHaveLength(2);
    });
  });

  describe('updateAccount', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAccountStore());
      act(() => {
        result.current.addAccount(mockAccount);
      });
    });

    it('should update an existing account', () => {
      const { result } = renderHook(() => useAccountStore());

      act(() => {
        result.current.updateAccount('acc-1', { name: 'Updated Name' });
      });

      expect(result.current.accounts[0].name).toBe('Updated Name');
    });

    it('should update the updatedAt timestamp', () => {
      const { result } = renderHook(() => useAccountStore());
      const originalTimestamp = mockAccount.updatedAt;

      act(() => {
        result.current.updateAccount('acc-1', { name: 'Updated Name' });
      });

      expect(result.current.accounts[0].updatedAt).not.toBe(originalTimestamp);
    });

    it('should mark changes as unsaved', () => {
      const { result } = renderHook(() => useAccountStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        appResult.current.setUnsavedChanges(false);
      });

      act(() => {
        result.current.updateAccount('acc-1', { name: 'Updated Name' });
      });

      expect(appResult.current.hasUnsavedChanges).toBe(true);
    });

    it('should not update non-existent account', () => {
      const { result } = renderHook(() => useAccountStore());
      const originalAccounts = [...result.current.accounts];

      act(() => {
        result.current.updateAccount('non-existent', { name: 'Updated Name' });
      });

      expect(result.current.accounts).toEqual(originalAccounts);
    });

    it('should update multiple fields', () => {
      const { result } = renderHook(() => useAccountStore());

      act(() => {
        result.current.updateAccount('acc-1', {
          name: 'Updated Name',
          initialBalance: 2000,
          isActive: false,
        });
      });

      expect(result.current.accounts[0].name).toBe('Updated Name');
      expect(result.current.accounts[0].initialBalance).toBe(2000);
      expect(result.current.accounts[0].isActive).toBe(false);
    });
  });

  describe('deleteAccount', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAccountStore());
      act(() => {
        result.current.addAccount(mockAccount);
      });
    });

    it('should delete an account', () => {
      const { result } = renderHook(() => useAccountStore());

      act(() => {
        result.current.deleteAccount('acc-1');
      });

      expect(result.current.accounts).toHaveLength(0);
    });

    it('should mark changes as unsaved', () => {
      const { result } = renderHook(() => useAccountStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        appResult.current.setUnsavedChanges(false);
      });

      act(() => {
        result.current.deleteAccount('acc-1');
      });

      expect(appResult.current.hasUnsavedChanges).toBe(true);
    });

    it('should not affect other accounts', () => {
      const { result } = renderHook(() => useAccountStore());
      const account2: Account = { ...mockAccount, id: 'acc-2', name: 'Savings' };

      act(() => {
        result.current.addAccount(account2);
      });

      act(() => {
        result.current.deleteAccount('acc-1');
      });

      expect(result.current.accounts).toHaveLength(1);
      expect(result.current.accounts[0].id).toBe('acc-2');
    });

    it('should handle deleting non-existent account', () => {
      const { result } = renderHook(() => useAccountStore());

      act(() => {
        result.current.deleteAccount('non-existent');
      });

      expect(result.current.accounts).toHaveLength(1);
    });
  });

  describe('getAccountById', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAccountStore());
      act(() => {
        result.current.addAccount(mockAccount);
      });
    });

    it('should return account by id', () => {
      const { result } = renderHook(() => useAccountStore());

      const account = result.current.getAccountById('acc-1');

      expect(account).toEqual(mockAccount);
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useAccountStore());

      const account = result.current.getAccountById('non-existent');

      expect(account).toBeUndefined();
    });
  });

  describe('getAccountsByType', () => {
    it('should return accounts of specific type', () => {
      const { result } = renderHook(() => useAccountStore());
      const bankAccount: Account = { ...mockAccount, id: 'acc-1', type: AccountType.BANK_ACCOUNT };
      const cash: Account = { ...mockAccount, id: 'acc-2', type: AccountType.CASH };
      const credit: Account = { ...mockAccount, id: 'acc-3', type: AccountType.CREDIT_CARD };

      act(() => {
        result.current.setAccounts([bankAccount, cash, credit]);
      });

      const bankAccounts = result.current.getAccountsByType(AccountType.BANK_ACCOUNT);

      expect(bankAccounts).toHaveLength(1);
      expect(bankAccounts[0].type).toBe(AccountType.BANK_ACCOUNT);
    });

    it('should return empty array for type with no accounts', () => {
      const { result } = renderHook(() => useAccountStore());
      const bankAccount: Account = { ...mockAccount, id: 'acc-1', type: AccountType.BANK_ACCOUNT };
      const cash: Account = { ...mockAccount, id: 'acc-2', type: AccountType.CASH };
      const credit: Account = { ...mockAccount, id: 'acc-3', type: AccountType.CREDIT_CARD };

      act(() => {
        result.current.setAccounts([bankAccount, cash, credit]);
      });

      const loanAccounts = result.current.getAccountsByType(AccountType.LOAN);

      expect(loanAccounts).toHaveLength(0);
    });

    it('should return multiple accounts of same type', () => {
      const { result } = renderHook(() => useAccountStore());
      const bankAccount: Account = { ...mockAccount, id: 'acc-1', type: AccountType.BANK_ACCOUNT };
      const cash: Account = { ...mockAccount, id: 'acc-2', type: AccountType.CASH };
      const credit: Account = { ...mockAccount, id: 'acc-3', type: AccountType.CREDIT_CARD };

      act(() => {
        result.current.setAccounts([bankAccount, cash, credit]);
      });

      const bankAccount2: Account = {
        ...mockAccount,
        id: 'acc-4',
        name: 'Bank Account 2',
        type: AccountType.BANK_ACCOUNT,
      };

      act(() => {
        result.current.addAccount(bankAccount2);
      });

      const bankAccounts = result.current.getAccountsByType(AccountType.BANK_ACCOUNT);

      expect(bankAccounts).toHaveLength(2);
    });
  });

  describe('resetAccounts', () => {
    it('should clear all accounts', () => {
      const { result } = renderHook(() => useAccountStore());

      act(() => {
        result.current.addAccount(mockAccount);
      });

      expect(result.current.accounts).toHaveLength(1);

      act(() => {
        result.current.resetAccounts();
      });

      expect(result.current.accounts).toHaveLength(0);
    });
  });
});
