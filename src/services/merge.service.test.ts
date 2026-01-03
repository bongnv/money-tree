import { performThreeWayMerge } from './merge.service';
import type { DataFile, Account } from '../types/models';
import { AccountType } from '../types/enums';

describe('merge.service', () => {
  const createAccount = (id: string, name: string): Account => ({
    id,
    name,
    type: AccountType.BANK_ACCOUNT,
    currencyId: 'usd',
    initialBalance: 0,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  });

  const createDataFile = (accounts: Account[]): DataFile => ({
    version: '1.0.0',
    years: {},
    accounts,
    categories: [],
    transactionTypes: [],
    archivedYears: [],
    lastModified: '2025-01-01T00:00:00Z',
  });

  describe('performThreeWayMerge', () => {
    it('should auto-merge when entity added in file only', () => {
      const base = createDataFile([]);
      const fileVersion = createDataFile([createAccount('1', 'New Account')]);
      const appVersion = createDataFile([]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(0);
      expect(result.merged.accounts).toHaveLength(1);
      expect(result.merged.accounts[0].name).toBe('New Account');
    });

    it('should auto-merge when entity added in app only', () => {
      const base = createDataFile([]);
      const fileVersion = createDataFile([]);
      const appVersion = createDataFile([createAccount('1', 'New Account')]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(0);
      expect(result.merged.accounts).toHaveLength(1);
      expect(result.merged.accounts[0].name).toBe('New Account');
    });

    it('should auto-merge when same entity added in both', () => {
      const base = createDataFile([]);
      const account = createAccount('1', 'New Account');
      const fileVersion = createDataFile([account]);
      const appVersion = createDataFile([account]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(0);
      expect(result.merged.accounts).toHaveLength(1);
    });

    it('should flag conflict when different entities added with same ID', () => {
      const base = createDataFile([]);
      const fileVersion = createDataFile([createAccount('1', 'File Account')]);
      const appVersion = createDataFile([createAccount('1', 'App Account')]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].conflictReason).toBe('both-modified');
    });

    it('should auto-merge when entity modified in file only', () => {
      const base = createDataFile([createAccount('1', 'Original')]);
      const fileVersion = createDataFile([createAccount('1', 'Modified in File')]);
      const appVersion = createDataFile([createAccount('1', 'Original')]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(0);
      expect(result.merged.accounts).toHaveLength(1);
      expect(result.merged.accounts[0].name).toBe('Modified in File');
    });

    it('should auto-merge when entity modified in app only', () => {
      const base = createDataFile([createAccount('1', 'Original')]);
      const fileVersion = createDataFile([createAccount('1', 'Original')]);
      const appVersion = createDataFile([createAccount('1', 'Modified in App')]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(0);
      expect(result.merged.accounts).toHaveLength(1);
      expect(result.merged.accounts[0].name).toBe('Modified in App');
    });

    it('should flag conflict when entity modified in both file and app', () => {
      const base = createDataFile([createAccount('1', 'Original')]);
      const fileVersion = createDataFile([createAccount('1', 'Modified in File')]);
      const appVersion = createDataFile([createAccount('1', 'Modified in App')]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('account');
      expect(result.conflicts[0].entityId).toBe('1');
      expect(result.conflicts[0].conflictReason).toBe('both-modified');
      expect((result.conflicts[0].fileVersion as Account).name).toBe('Modified in File');
      expect((result.conflicts[0].appVersion as Account).name).toBe('Modified in App');
    });

    it('should auto-merge when entity deleted in file and unchanged in app', () => {
      const base = createDataFile([createAccount('1', 'Account')]);
      const fileVersion = createDataFile([]);
      const appVersion = createDataFile([createAccount('1', 'Account')]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(0);
      expect(result.merged.accounts).toHaveLength(0);
    });

    it('should auto-merge when entity deleted in app and unchanged in file', () => {
      const base = createDataFile([createAccount('1', 'Account')]);
      const fileVersion = createDataFile([createAccount('1', 'Account')]);
      const appVersion = createDataFile([]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(0);
      expect(result.merged.accounts).toHaveLength(0);
    });

    it('should flag conflict when entity deleted in file but modified in app', () => {
      const base = createDataFile([createAccount('1', 'Original')]);
      const fileVersion = createDataFile([]);
      const appVersion = createDataFile([createAccount('1', 'Modified in App')]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].conflictReason).toBe('delete-modify');
      expect(result.conflicts[0].fileVersion).toBeNull();
      expect((result.conflicts[0].appVersion as Account).name).toBe('Modified in App');
    });

    it('should flag conflict when entity deleted in app but modified in file', () => {
      const base = createDataFile([createAccount('1', 'Original')]);
      const fileVersion = createDataFile([createAccount('1', 'Modified in File')]);
      const appVersion = createDataFile([]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].conflictReason).toBe('delete-modify');
      expect((result.conflicts[0].fileVersion as Account).name).toBe('Modified in File');
      expect(result.conflicts[0].appVersion).toBeNull();
    });

    it('should handle multiple entities with mix of changes', () => {
      const base = createDataFile([
        createAccount('1', 'Unchanged'),
        createAccount('2', 'Modified in File'),
        createAccount('3', 'Modified in App'),
        createAccount('4', 'Modified in Both'),
      ]);
      const fileVersion = createDataFile([
        createAccount('1', 'Unchanged'),
        createAccount('2', 'File Change'),
        createAccount('3', 'Modified in App'),
        createAccount('4', 'File Change'),
        createAccount('5', 'New in File'),
      ]);
      const appVersion = createDataFile([
        createAccount('1', 'Unchanged'),
        createAccount('2', 'Modified in File'),
        createAccount('3', 'App Change'),
        createAccount('4', 'App Change'),
        createAccount('6', 'New in App'),
      ]);

      const result = performThreeWayMerge(base, fileVersion, appVersion);

      // Conflicts: Account 4 (modified in both)
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].entityId).toBe('4');

      // Merged: 1 (unchanged), 2 (file), 3 (app), 5 (new file), 6 (new app)
      expect(result.merged.accounts).toHaveLength(5);
    });
  });
});
