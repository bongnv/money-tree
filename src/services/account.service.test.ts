import { AccountService } from './account.service';
import { db } from '../db/database';
import { AccountType, CurrencyCode } from '../types/enums';
import type { Account } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';

const mockSyncMetadataService = {
  setLastModified: jest.fn(),
  getLastModified: jest.fn(),
  getBaseCurrency: jest.fn(),
  setBaseCurrency: jest.fn(),
  getArchivedYears: jest.fn(),
  setArchivedYears: jest.fn(),
  addArchivedYear: jest.fn(),
  clear: jest.fn(),
  setLastModifiedIfNewer: jest.fn(),
} as unknown as SyncMetadataService;

jest.mock('../db/database', () => ({
  db: {
    accounts: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    syncMetadata: {
      put: jest.fn(),
      get: jest.fn(),
    },
  },
}));

describe('accountService', () => {
  let accountService: AccountService;
  const mockAccount: Account = {
    id: '1',
    name: 'Test Account',
    type: AccountType.BANK_ACCOUNT,
    currencyCode: CurrencyCode.USD,
    initialBalance: 0,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountService = new AccountService(db, mockSyncMetadataService);
  });

  describe('getAll', () => {
    it('should return all accounts', async () => {
      (db.accounts.toArray as jest.Mock).mockResolvedValue([mockAccount]);

      const result = await accountService.getAll();

      expect(result).toEqual([mockAccount]);
      expect(db.accounts.toArray).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return account by id', async () => {
      (db.accounts.get as jest.Mock).mockResolvedValue(mockAccount);

      const result = await accountService.getById('1');

      expect(result).toEqual(mockAccount);
      expect(db.accounts.get).toHaveBeenCalledWith('1');
    });
  });

  describe('getActive', () => {
    it('should return only active accounts', async () => {
      const mockFilter = {
        toArray: jest.fn().mockResolvedValue([mockAccount]),
      };
      (db.accounts.filter as jest.Mock).mockReturnValue(mockFilter);

      const result = await accountService.getActive();

      expect(result).toEqual([mockAccount]);
      expect(db.accounts.filter).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new account with timestamps', async () => {
      const newAccount = {
        name: 'New Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: 0,
        isActive: true,
        isDeleted: false,
      };
      (db.accounts.add as jest.Mock).mockResolvedValue('1');

      const id = await accountService.create(newAccount);

      expect(typeof id).toBe('string');
      expect(id).toBeTruthy();
      expect(db.accounts.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newAccount,
          isActive: true,
          isDeleted: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });

    it('should preserve isActive if provided', async () => {
      const newAccount = {
        name: 'Inactive Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: 0,
        isActive: false,
        isDeleted: false,
      };
      (db.accounts.add as jest.Mock).mockResolvedValue('2');

      await accountService.create(newAccount);

      expect(db.accounts.add).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing account', async () => {
      (db.accounts.get as jest.Mock).mockResolvedValue(mockAccount);
      (db.accounts.update as jest.Mock).mockResolvedValue(1);

      await accountService.update('1', { name: 'Updated Account' });

      expect(db.accounts.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'Updated Account',
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if account not found', async () => {
      (db.accounts.get as jest.Mock).mockResolvedValue(undefined);

      await expect(accountService.update('999', { name: 'Updated' })).rejects.toThrow(
        'Account with id 999 not found'
      );
    });
  });

  describe('delete', () => {
    it('should soft delete an account', async () => {
      (db.accounts.get as jest.Mock).mockResolvedValue(mockAccount);
      (db.accounts.update as jest.Mock).mockResolvedValue(1);

      await accountService.delete('1');

      expect(db.accounts.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          isDeleted: true,
          updatedAt: expect.any(String),
        })
      );
    });

    it('should throw error if account not found', async () => {
      (db.accounts.get as jest.Mock).mockResolvedValue(undefined);

      await expect(accountService.delete('999')).rejects.toThrow('Account with id 999 not found');
    });
  });

  describe('archive', () => {
    it('should archive an account by setting isActive to false', async () => {
      (db.accounts.get as jest.Mock).mockResolvedValue(mockAccount);
      (db.accounts.update as jest.Mock).mockResolvedValue(1);

      await accountService.archive('1');

      expect(db.accounts.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          isActive: false,
        })
      );
    });
  });

  describe('unarchive', () => {
    it('should unarchive an account by setting isActive to true', async () => {
      (db.accounts.get as jest.Mock).mockResolvedValue(mockAccount);
      (db.accounts.update as jest.Mock).mockResolvedValue(1);

      await accountService.unarchive('1');

      expect(db.accounts.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          isActive: true,
        })
      );
    });
  });

  describe('validateAccountForm', () => {
    it('should return no errors for valid form data', () => {
      const formData = {
        name: 'Savings Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '1000.50',
        description: 'My savings',
        isActive: true,
      };

      const errors = accountService.validateAccountForm(formData);

      expect(errors).toHaveLength(0);
    });

    it('should return error when name is empty', () => {
      const formData = {
        name: '   ',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '1000',
        isActive: true,
      };

      const errors = accountService.validateAccountForm(formData);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        field: 'name',
        message: 'Account name is required',
      });
    });

    it('should return error when type is missing', () => {
      const formData = {
        name: 'Test Account',
        type: '' as AccountType,
        currencyCode: CurrencyCode.USD,
        initialBalance: '1000',
        isActive: true,
      };

      const errors = accountService.validateAccountForm(formData);

      expect(errors).toContainEqual({
        field: 'type',
        message: 'Account type is required',
      });
    });

    it('should return error when currency is missing', () => {
      const formData = {
        name: 'Test Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: '' as CurrencyCode,
        initialBalance: '1000',
        isActive: true,
      };

      const errors = accountService.validateAccountForm(formData);

      expect(errors).toContainEqual({
        field: 'currencyCode',
        message: 'Currency is required',
      });
    });

    it('should return error when initial balance is not a number', () => {
      const formData = {
        name: 'Test Account',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: 'invalid',
        isActive: true,
      };

      const errors = accountService.validateAccountForm(formData);

      expect(errors).toContainEqual({
        field: 'initialBalance',
        message: 'Initial balance must be a valid number',
      });
    });

    it('should return multiple errors when multiple fields are invalid', () => {
      const formData = {
        name: '',
        type: '' as AccountType,
        currencyCode: '' as CurrencyCode,
        initialBalance: 'abc',
        isActive: true,
      };

      const errors = accountService.validateAccountForm(formData);

      expect(errors).toHaveLength(4);
      expect(errors.map((e) => e.field)).toEqual(
        expect.arrayContaining(['name', 'type', 'currencyCode', 'initialBalance'])
      );
    });
  });

  describe('transformFormToAccount', () => {
    it('should transform form data to account entity', () => {
      const formData = {
        name: '  Savings Account  ',
        type: AccountType.INVESTMENT,
        currencyCode: CurrencyCode.AUD,
        initialBalance: '2500.75',
        description: '  Emergency fund  ',
        isActive: false,
      };

      const result = accountService.transformFormToAccount(formData);

      expect(result).toEqual({
        name: 'Savings Account',
        type: AccountType.INVESTMENT,
        currencyCode: CurrencyCode.AUD,
        initialBalance: 2500.75,
        description: 'Emergency fund',
        isActive: false,
        isDeleted: false,
      });
    });

    it('should handle missing description', () => {
      const formData = {
        name: 'Checking',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '0',
        isActive: true,
      };

      const result = accountService.transformFormToAccount(formData);

      expect(result.description).toBeUndefined();
    });

    it('should handle empty description', () => {
      const formData = {
        name: 'Checking',
        type: AccountType.BANK_ACCOUNT,
        currencyCode: CurrencyCode.USD,
        initialBalance: '0',
        description: '   ',
        isActive: true,
      };

      const result = accountService.transformFormToAccount(formData);

      expect(result.description).toBeUndefined();
    });
  });
});
