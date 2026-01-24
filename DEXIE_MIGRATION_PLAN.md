# Dexie Migration Plan - Big Bang Approach

## Executive Summary

This document outlines the plan to migrate Money Tree from **Zustand + File-based** architecture to **Dexie (IndexedDB)** for improved offline-first capabilities and better performance.

**Timeline**: 3 weeks
**Approach**: Big Bang - implement complete new architecture, then switch over
**Risk Level**: Low (local-first app, easy rollback, comprehensive testing)

---

## Current Architecture

### What We Have Now
- **State Management**: Zustand stores (6 stores: App, Transaction, Account, Category, Budget, Asset, ExchangeRate)
- **Data Persistence**: JSON file-based (OneDrive, Google Drive)
- **Sync Strategy**: Manual sync with 3-way merge for conflict resolution
- **Pain Points**:
  - All data in memory (not ideal for large datasets)
  - Complex 3-way merge logic for conflicts
  - Must load entire dataset to filter/search
  - No query optimization
  - Multiple storage providers increase complexity

---

## Target Architecture

### What We're Building
- **Local Database**: Dexie.js (IndexedDB wrapper)
- **Reactive Queries**: Dexie's `useLiveQuery()` for real-time UI updates
- **State Management**: Dexie for data + React Context for UI state
- **Cloud Sync**: Simple last-write-wins with soft deletes
- **No TanStack Query**: Not needed for local-first apps (no network latency to optimize)

### Key Benefits
1. ✅ **Offline-First**: IndexedDB provides 50MB+ storage (vs 5-10MB localStorage)
2. ✅ **Query Optimization**: Indexed queries, pagination, efficient filtering
3. ✅ **Real-time Updates**: `useLiveQuery()` automatically re-renders on changes
4. ✅ **Simpler Sync**: Last-write-wins + soft deletes (no complex 3-way merge)
5. ✅ **Better Performance**: Direct database access, <1ms queries
6. ✅ **Simpler Architecture**: No redundant caching layer

---

## Conflict Resolution Strategy

### New Approach: Soft Delete + Last Write Wins

**Why Change from 3-Way Merge?**
- ❌ 3-way merge is complex and hard to maintain
- ❌ Requires storing base version and complex diff logic
- ❌ Difficult to handle delete conflicts
- ✅ LWW + soft delete is simpler and more predictable
- ✅ Users rarely sync from multiple devices simultaneously
- ✅ Automatic backups provide safety net

### How It Works

**1. Soft Deletes**
```typescript
interface Transaction {
  id: string;
  amount: number;
  // ... other fields
  isDeleted: boolean;      // Soft delete flag
  updatedAt: string;       // Last modification timestamp (also tracks deletion time)
}
```

**Benefits**:
- Deleted items stay in database but hidden from queries
- Can sync deletes across devices
- Can restore accidentally deleted items
- Prevents "zombie" records that reappear after sync

**2. Last Write Wins**
```typescript
async function syncWithCloud() {
  const cloudData = await loadFromCloud();
  const localData = await db.transactions.toArray();
  
  // Merge by taking latest updatedAt
  const merged = mergeByTimestamp(localData, cloudData);
  
  await db.transactions.bulkPut(merged);
  await saveToCloud(merged);
}

function mergeByTimestamp(local: Transaction[], remote: Transaction[]): Transaction[] {
  const map = new Map<string, Transaction>();
  
  // Add all local items
  local.forEach(item => map.set(item.id, item));
  
  // Replace with remote if remote is newer
  remote.forEach(item => {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt) {
      map.set(item.id, item);
    }
  });
  
  return Array.from(map.values());
}
```

**3. Automatic Backups**
- Create daily backups to cloud
- Keep last 7 backups
- Users can restore if something goes wrong
- Provides safety net for LWW conflicts

---

## Implementation Plan

### Phase 1: Build Complete Data Layer (Week 1-2)

#### 1.1: Database Schema

Create `src/db/database.ts`:

```typescript
import Dexie, { Table } from 'dexie';
import type {
  Transaction,
  Account,
  Category,
  TransactionType,
  Budget,
  ManualAsset,
  ExchangeRate,
} from '../types/models';

interface SyncMetadata {
  key: string;
  value: any;
}

export class MoneyTreeDB extends Dexie {
  transactions!: Table<Transaction>;
  accounts!: Table<Account>;
  categories!: Table<Category>;
  transactionTypes!: Table<TransactionType>;
  budgets!: Table<Budget>;
  manualAssets!: Table<ManualAsset>;
  exchangeRates!: Table<ExchangeRate>;
  syncMetadata!: Table<SyncMetadata>;

  constructor() {
    super('MoneyTreeDB');
    
    this.version(1).stores({
      // Transactions: indexed by date, type, accounts for fast queries
      transactions: 'id, date, transactionTypeId, fromAccountId, toAccountId, isDeleted, [date+isDeleted], [fromAccountId+date], [toAccountId+date]',
      
      // Accounts: indexed by type, currency, active status
      accounts: 'id, name, type, currencyCode, isActive, isDeleted, [type+isActive]',
      
      // Categories: simple table
      categories: 'id, name, isDeleted',
      
      // Transaction Types: indexed by category and group
      transactionTypes: 'id, name, categoryId, group, isActive, isDeleted, [categoryId+isActive]',
      
      // Budgets: indexed by date range for fast queries
      budgets: 'id, transactionTypeId, period, startDate, endDate, isDeleted, [startDate+endDate]',
      
      // Manual Assets: indexed by type and currency
      manualAssets: 'id, name, type, currencyCode, isDeleted',
      
      // Exchange Rates: compound index for fast lookups
      exchangeRates: 'id, month, fromCurrency, toCurrency, [month+fromCurrency+toCurrency]',
      
      // Sync Metadata: key-value store
      syncMetadata: 'key',
    });
  }
}

export const db = new MoneyTreeDB();

// Helper functions for sync metadata
export const syncMetadata = {
  async get(key: string): Promise<any> {
    const record = await db.syncMetadata.get(key);
    return record?.value;
  },
  
  async set(key: string, value: any): Promise<void> {
    await db.syncMetadata.put({ key, value });
  },
  
  async getLastSynced(): Promise<string | null> {
    return this.get('lastSynced');
  },
  
  async setLastSynced(timestamp: string): Promise<void> {
    await this.set('lastSynced', timestamp);
  },
  
  async getFileName(): Promise<string | null> {
    return this.get('fileName');
  },
  
  async setFileName(name: string): Promise<void> {
    await this.set('fileName', name);
  },
};
```

**Test Coverage**:
- Database initializes
- All tables accessible
- Indexes work correctly
- Metadata helpers work

---

#### 1.2: Repository Layer

Create `src/db/repositories/transactionRepository.ts`:

```typescript
import { db } from '../database';
import type { Transaction } from '../../types/models';

export const transactionRepository = {
  // Get all non-deleted transactions
  async getAll(): Promise<Transaction[]> {
    return db.transactions
      .where('isDeleted')
      .equals(0)
      .toArray();
  },
  
  // Get by date range (non-deleted)
  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return db.transactions
      .where('[date+isDeleted]')
      .between([startDate, 0], [endDate, 0], true, true)
      .toArray();
  },
  
  // Get by account (non-deleted)
  async getByAccount(accountId: string): Promise<Transaction[]> {
    return db.transactions
      .where('isDeleted')
      .equals(0)
      .filter(t => t.fromAccountId === accountId || t.toAccountId === accountId)
      .toArray();
  },
  
  // Get by transaction type (non-deleted)
  async getByType(transactionTypeId: string): Promise<Transaction[]> {
    return db.transactions
      .where({ transactionTypeId, isDeleted: 0 })
      .toArray();
  },
  
  // Add new transaction
  async add(transaction: Transaction): Promise<string> {
    const now = new Date().toISOString();
    const data = {
      ...transaction,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    return db.transactions.add(data);
  },
  
  // Update transaction
  async update(id: string, updates: Partial<Transaction>): Promise<void> {
    await db.transactions.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
  
  // Soft delete
  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.transactions.update(id, {
      isDeleted: true,
      updatedAt: now,
    });
  },
  
  // Hard delete (for cleanup)
  async hardDelete(id: string): Promise<void> {
    await db.transactions.delete(id);
  },
  
  // Get all including deleted (for sync)
  async getAllIncludingDeleted(): Promise<Transaction[]> {
    return db.transactions.toArray();
  },
};
```

Create similar repositories for:
- `accountRepository.ts`
- `categoryRepository.ts`
- `transactionTypeRepository.ts`
- `budgetRepository.ts`
- `assetRepository.ts`
- `exchangeRateRepository.ts`

**Test Coverage**:
- All CRUD operations
- Soft delete works
- Queries filter out deleted items
- Compound indexes work

---

#### 1.3: Query Hooks

Create `src/hooks/queries/useTransactions.ts`:

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { Transaction } from '../../types/models';

// Get all active transactions - auto-updates on changes!
export function useTransactions(): Transaction[] | undefined {
  return useLiveQuery(
    () => db.transactions
      .where('isDeleted')
      .equals(0)
      .toArray()
  );
}

// Get transactions by date range
export function useTransactionsByDateRange(
  startDate: string,
  endDate: string
): Transaction[] | undefined {
  return useLiveQuery(
    () => db.transactions
      .where('[date+isDeleted]')
      .between([startDate, 0], [endDate, 0], true, true)
      .toArray(),
    [startDate, endDate]
  );
}

// Get transactions by account
export function useTransactionsByAccount(
  accountId: string
): Transaction[] | undefined {
  return useLiveQuery(
    () => db.transactions
      .where('isDeleted')
      .equals(0)
      .filter(t => t.fromAccountId === accountId || t.toAccountId === accountId)
      .toArray(),
    [accountId]
  );
}

// Get single transaction
export function useTransaction(id: string): Transaction | undefined {
  return useLiveQuery(
    () => db.transactions.get(id),
    [id]
  );
}
```

Create similar hooks for all entities:
- `useAccounts.ts`
- `useCategories.ts`
- `useBudgets.ts`
- `useAssets.ts`
- `useExchangeRates.ts`

**Test Coverage**:
- Hooks return correct data
- Hooks update when data changes
- Loading state (undefined) works
- Dependencies trigger re-query

---

#### 1.4: Mutation Functions

Create `src/hooks/mutations/useTransactionMutations.ts`:

```typescript
import { useState } from 'react';
import { transactionRepository } from '../../db/repositories/transactionRepository';
import type { Transaction } from '../../types/models';
import { cloudSyncService } from '../../services/cloudSync.service';

export function useTransactionMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const add = async (transaction: Transaction) => {
    setIsLoading(true);
    setError(null);
    try {
      await transactionRepository.add(transaction);
      // useLiveQuery automatically updates UI
      
      // Schedule cloud sync
      cloudSyncService.scheduleSync();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (id: string, updates: Partial<Transaction>) => {
    setIsLoading(true);
    setError(null);
    try {
      await transactionRepository.update(id, updates);
      cloudSyncService.scheduleSync();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await transactionRepository.softDelete(id);
      cloudSyncService.scheduleSync();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { add, update, remove, isLoading, error };
}
```

Create similar mutation hooks for all entities.

**Test Coverage**:
- Mutations execute correctly
- Loading states work
- Error handling works
- Triggers cloud sync

---

#### 1.5: Export/Import Service

Create `src/services/dexieExport.service.ts`:

```typescript
import { db } from '../db/database';
import type { DataFile } from '../types/models';
import { CurrencyCode } from '../types/enums';

export class DexieExportService {
  // Export all data to JSON format (compatible with old format)
  async exportToJson(): Promise<DataFile> {
    const [
      transactions,
      accounts,
      categories,
      transactionTypes,
      budgets,
      assets,
      rates,
      archivedYears,
      baseCurrency,
    ] = await Promise.all([
      db.transactions.toArray(),
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactionTypes.toArray(),
      db.budgets.toArray(),
      db.manualAssets.toArray(),
      db.exchangeRates.toArray(),
      db.syncMetadata.get('archivedYears').then(r => r?.value || []),
      db.syncMetadata.get('baseCurrency').then(r => r?.value || CurrencyCode.USD),
    ]);

    return {
      version: '1.0.0',
      transactions,
      accounts,
      categories,
      transactionTypes,
      budgets,
      manualAssets: assets,
      exchangeRates: rates,
      archivedYears,
      baseCurrency,
      lastModified: new Date().toISOString(),
    };
  }

  // Import from JSON format
  async importFromJson(dataFile: DataFile): Promise<void> {
    await db.transaction(
      'rw',
      db.transactions,
      db.accounts,
      db.categories,
      db.transactionTypes,
      db.budgets,
      db.manualAssets,
      db.exchangeRates,
      db.syncMetadata,
      async () => {
        // Clear existing data
        await Promise.all([
          db.transactions.clear(),
          db.accounts.clear(),
          db.categories.clear(),
          db.transactionTypes.clear(),
          db.budgets.clear(),
          db.manualAssets.clear(),
          db.exchangeRates.clear(),
        ]);

        // Import new data
        await Promise.all([
          db.transactions.bulkAdd(dataFile.transactions),
          db.accounts.bulkAdd(dataFile.accounts),
          db.categories.bulkAdd(dataFile.categories),
          db.transactionTypes.bulkAdd(dataFile.transactionTypes),
          db.budgets.bulkAdd(dataFile.budgets),
          db.manualAssets.bulkAdd(dataFile.manualAssets),
          db.exchangeRates.bulkAdd(dataFile.exchangeRates),
        ]);

        // Import metadata
        await db.syncMetadata.bulkPut([
          { key: 'archivedYears', value: dataFile.archivedYears },
          { key: 'baseCurrency', value: dataFile.baseCurrency },
        ]);
      }
    );
  }

  // Merge with cloud data using Last Write Wins
  async mergeWithCloud(cloudData: DataFile): Promise<void> {
    await db.transaction(
      'rw',
      db.transactions,
      db.accounts,
      db.categories,
      db.transactionTypes,
      db.budgets,
      db.manualAssets,
      db.exchangeRates,
      async () => {
        // Merge transactions
        await this.mergeLWW(db.transactions, cloudData.transactions);
        
        // Merge all other entities
        await Promise.all([
          this.mergeLWW(db.accounts, cloudData.accounts),
          this.mergeLWW(db.categories, cloudData.categories),
          this.mergeLWW(db.transactionTypes, cloudData.transactionTypes),
          this.mergeLWW(db.budgets, cloudData.budgets),
          this.mergeLWW(db.manualAssets, cloudData.manualAssets),
          this.mergeLWW(db.exchangeRates, cloudData.exchangeRates),
        ]);
      }
    );
  }

  // Last Write Wins merge
  private async mergeLWW<T extends { id: string; updatedAt: string }>(
    table: Dexie.Table<T>,
    remoteItems: T[]
  ): Promise<void> {
    const localItems = await table.toArray();
    const localMap = new Map(localItems.map(item => [item.id, item]));

    const itemsToUpdate: T[] = [];

    // Check each remote item
    for (const remoteItem of remoteItems) {
      const localItem = localMap.get(remoteItem.id);

      if (!localItem) {
        // New item from remote
        itemsToUpdate.push(remoteItem);
      } else if (remoteItem.updatedAt > localItem.updatedAt) {
        // Remote is newer
        itemsToUpdate.push(remoteItem);
      }
      // else: local is newer, keep it
    }

    if (itemsToUpdate.length > 0) {
      await table.bulkPut(itemsToUpdate);
    }
  }
}

export const dexieExportService = new DexieExportService();
```

**Test Coverage**:
- Export produces valid JSON
- Import preserves all data
- LWW merge keeps latest records
- Handles conflicts correctly

---

#### 1.6: Cloud Sync Service

Create `src/services/cloudSync.service.ts`:

```typescript
import { dexieExportService } from './dexieExport.service';
import { StorageService } from './storage/StorageService';
import { syncMetadata } from '../db/database';

export class CloudSyncService {
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor(private storageService: StorageService) {}

  // Sync to cloud (upload)
  async syncToCloud(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      const dataFile = await dexieExportService.exportToJson();
      const content = JSON.stringify(dataFile, null, 2);

      await this.storageService.writeMainFile(content);
      await syncMetadata.setLastSynced(new Date().toISOString());
    } finally {
      this.isSyncing = false;
    }
  }

  // Load from cloud and merge (download)
  async loadFromCloud(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      const content = await this.storageService.readMainFile();
      const cloudData = JSON.parse(content);

      // Merge using Last Write Wins
      await dexieExportService.mergeWithCloud(cloudData);
      
      await syncMetadata.setLastSynced(new Date().toISOString());
    } finally {
      this.isSyncing = false;
    }
  }

  // Schedule sync with debouncing
  scheduleSync(delayMs: number = 30000): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = setTimeout(() => {
      this.syncToCloud().catch(error => {
        console.error('Auto-sync failed:', error);
      });
    }, delayMs);
  }

  // Cancel scheduled sync
  cancelScheduledSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  // Bi-directional sync (download then upload)
  async fullSync(): Promise<void> {
    await this.loadFromCloud(); // Merge remote changes
    await this.syncToCloud();   // Upload local changes
  }
}

// Will be initialized in App.tsx
export let cloudSyncService: CloudSyncService;

export function initCloudSyncService(storageService: StorageService) {
  cloudSyncService = new CloudSyncService(storageService);
}
```

**Test Coverage**:
- Upload works
- Download and merge works
- Debounced sync works
- Full bi-directional sync works

---

#### 1.7: App Context for UI State

Create `src/contexts/AppContext.tsx`:

```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { AlertColor } from '@mui/material';
import { CurrencyCode } from '../types/enums';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface AppContextValue {
  // Cloud storage
  cloudProvider: 'onedrive' | 'googledrive' | null;
  setCloudProvider: (provider: 'onedrive' | 'googledrive' | null) => void;
  cloudFileName: string | null;
  setCloudFileName: (name: string | null) => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  
  // Snackbar
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity?: AlertColor) => void;
  hideSnackbar: () => void;
  
  // Settings
  baseCurrency: CurrencyCode;
  setBaseCurrency: (currency: CurrencyCode) => void;
  
  // Welcome dialog
  shouldShowWelcome: boolean;
  setShouldShowWelcome: (show: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cloudProvider, setCloudProvider] = useState<'onedrive' | 'googledrive' | null>(null);
  const [cloudFileName, setCloudFileName] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState(CurrencyCode.USD);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = (message: string, severity: AlertColor = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const value: AppContextValue = {
    cloudProvider,
    setCloudProvider,
    cloudFileName,
    setCloudFileName,
    isLoading,
    setLoading,
    isSyncing,
    setIsSyncing,
    snackbar,
    showSnackbar,
    hideSnackbar,
    baseCurrency,
    setBaseCurrency,
    shouldShowWelcome,
    setShouldShowWelcome,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
```

**Test Coverage**:
- Context provides all values
- State updates work
- Hooks throw error outside provider

---

### Phase 2: Update All Components (Week 2)

#### 2.1: Update Welcome/Onboarding UI

**Remove Local Storage Option**:
- Update [WelcomeDialog.tsx](src/components/onboarding/WelcomeDialog.tsx):
  - Remove `StorageProviderType.LOCAL` option and UI
  - Remove File System Access API code
  - Remove local file picker buttons
  - Keep only OneDrive and Google Drive options
  - Update tests to remove local storage scenarios

- Update [CloudFilePicker.tsx](src/components/common/CloudFilePicker.tsx):
  - Already generic, no changes needed
  - Verify it works with OneDrive and Google Drive only

**Test Coverage**:
- WelcomeDialog only shows cloud options
- No local storage references in UI
- Cloud pickers work correctly

#### 2.2: Component Update Pattern

**Before (Zustand)**:
```typescript
import { useTransactionStore } from '../../stores/useTransactionStore';

function TransactionsList() {
  const transactions = useTransactionStore(state => state.transactions);
  const addTransaction = useTransactionStore(state => state.addTransaction);
  
  const handleAdd = () => {
    addTransaction(newTransaction);
  };
  
  return <List>{/* render */}</List>;
}
```

**After (Dexie)**:
```typescript
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useTransactionMutations } from '../../hooks/mutations/useTransactionMutations';

function TransactionsList() {
  const transactions = useTransactions(); // Auto-updates!
  const { add, isLoading } = useTransactionMutations();
  
  const handleAdd = async () => {
    await add(newTransaction);
    // UI automatically updates via useLiveQuery
  };
  
  if (!transactions) return <CircularProgress />;
  
  return <List>{/* render */}</List>;
}
```

#### 2.2: Components to Update

**Transaction Components**:
- [ ] `TransactionsList.tsx`
- [ ] `TransactionDialog.tsx`
- [ ] `QuickTransactionEntry.tsx`
- [ ] `TransactionFilters.tsx`

**Account Components**:
- [ ] `AccountsList.tsx`
- [ ] `AccountDialog.tsx`
- [ ] `AccountDetails.tsx`

**Category Components**:
- [ ] `CategoriesList.tsx`
- [ ] `CategoryDialog.tsx`
- [ ] `TransactionTypeForm.tsx`

**Budget Components**:
- [ ] `BudgetsList.tsx`
- [ ] `BudgetDialog.tsx`
- [ ] `BudgetProgressBar.tsx`

**Asset Components**:
- [ ] `ManualAssetsPage.tsx`
- [ ] `AssetDialog.tsx`
- [ ] `AssetValueHistory.tsx`

**Report Components**:
- [ ] `BalanceSheet.tsx`
- [ ] `CashFlowReport.tsx`
- [ ] `DashboardCards.tsx`

**Dashboard & Navigation**:
- [ ] `Dashboard.tsx`
- [ ] `RecentTransactionsList.tsx`
- [ ] Navigation components

#### 2.3: Remove Old Code

```bash
# Delete Zustand stores
rm -rf src/stores/

# Delete local storage services
rm src/services/storage/LocalStorageProvider.ts
rm src/services/storage/FilePickerService.ts

# Remove Zustand dependency
npm uninstall zustand

# Verify no imports remain
grep -r "from '.*stores/" src/
grep -r "zustand" src/
grep -r "LocalStorageProvider\|FilePickerService" src/
```

#### 2.4: Update Tests

Update all component tests to:
- Use new Dexie hooks
- Mock `useLiveQuery` instead of Zustand stores
- Test loading states (undefined return)
- Test mutations with async/await

---

### Phase 3: Testing & Migration (Week 3)

#### 3.1: End-to-End Testing

**Transaction Management**:
- [ ] Add transaction via quick entry
- [ ] Edit transaction
- [ ] Delete transaction (verify soft delete)
- [ ] Filter by date range
- [ ] Filter by account
- [ ] Search transactions

**Account Management**:
- [ ] Create account
- [ ] Edit account
- [ ] View transaction history
- [ ] Calculate balance

**Budget Tracking**:
- [ ] Create monthly budget
- [ ] View progress
- [ ] Edit budget
- [ ] Delete budget

**Reports**:
- [ ] Generate balance sheet
- [ ] Generate cash flow report
- [ ] Multi-currency conversions
- [ ] Export report data

**Cloud Sync**:
- [ ] Initial sync to OneDrive
- [ ] Bi-directional sync
- [ ] Last-write-wins conflict resolution
- [ ] Soft delete sync
- [ ] Auto-sync on changes
- [ ] Network error handling

#### 3.2: Performance Testing

**Load Testing**:
```typescript
// Create test data
for (let i = 0; i < 10000; i++) {
  await db.transactions.add({
    id: `test-${i}`,
    amount: Math.random() * 1000,
    date: '2024-01-01',
    // ...
  });
}

// Benchmark queries
console.time('Load all');
const all = await db.transactions.toArray();
console.timeEnd('Load all'); // Target: <50ms

console.time('Filter by date');
const filtered = await db.transactions
  .where('[date+isDeleted]')
  .between(['2024-01-01', 0], ['2024-12-31', 0])
  .toArray();
console.timeEnd('Filter by date'); // Target: <20ms

console.time('Filter by account');
const byAccount = await db.transactions
  .where('fromAccountId')
  .equals('account-1')
  .toArray();
console.timeEnd('Filter by account'); // Target: <10ms
```

**Performance Targets**:
- [ ] 1,000 transactions: <100ms render
- [ ] 10,000 transactions: <500ms render
- [ ] Date range filter: <20ms
- [ ] Account filter: <10ms
- [ ] Sync operation: <2s

**Optimization**:
- [ ] Add virtual scrolling if needed
- [ ] Lazy load transaction details
- [ ] Optimize bundle size
- [ ] Profile with React DevTools

#### 3.3: Automated Test Suite

```bash
# Run all tests
npm test -- --coverage

# Check coverage (target: ≥80%)
# Should see:
# - Repositories: >90%
# - Hooks: >85%
# - Services: >80%
# - Components: >75%

# Build and verify
npm run build

# Lint
npm run lint
```

#### 3.4: First-Time Load (No Special Migration Needed)

**Simplified Approach**: The "migration" is just the normal cloud sync on first run!

**App Initialization Flow**:

```typescript
// In App.tsx or initialization
async function initializeApp() {
  // Check if we have local data
  const hasLocalData = (await db.transactions.count()) > 0;
  
  if (hasLocalData) {
    // Already using Dexie, just continue
    // Maybe do a background sync
    cloudSyncService.scheduleSync();
    return;
  }
  
  // Empty Dexie - first time or new device
  // Check if user has connected cloud storage
  const hasCloudProvider = await storageService.isConnected();
  
  if (!hasCloudProvider) {
    // New user - show welcome dialog
    setShowWelcome(true);
    return;
  }
  
  // Has cloud storage - load from cloud to Dexie
  try {
    await cloudSyncService.loadFromCloud(); // This IS the migration!
    console.log('Loaded data from cloud');
  } catch (error) {
    console.error('Failed to load from cloud:', error);
    // Show error, maybe show welcome dialog again
  }
}
```

**That's it!** No special migration service needed. The existing cloud sync service handles everything:
- First load: Cloud → Dexie
- Subsequent use: Dexie + periodic sync

**Test Scenarios**:
- [ ] New user (empty Dexie, no cloud) → Welcome dialog
- [ ] Existing user (empty Dexie, has cloud) → Load from cloud
- [ ] Already migrated (has Dexie data) → Just use Dexie
- [ ] Multiple devices → Load from cloud on each device

---

## Timeline & Checklist

### Pre-Migration (Day 0)
- [ ] Create branch: `feature/dexie-migration`
- [ ] Tag current main: `git tag pre-dexie-migration`
- [ ] Backup production data
- [ ] Document all component interfaces

### Week 1-2: Build Data Layer
**Database & Infrastructure**:
- [ ] Install Dexie: `npm install dexie dexie-react-hooks`
- [ ] Create database schema with soft delete support
- [ ] Create SyncMetadata helpers
- [ ] Create AppContext (remove fileName, add cloudProvider/cloudFileName)

**Repositories** (all entities):
- [ ] transactionRepository.ts (with soft delete)
- [ ] accountRepository.ts
- [ ] categoryRepository.ts
- [ ] budgetRepository.ts
- [ ] assetRepository.ts
- [ ] exchangeRateRepository.ts

**Query Hooks** (all entities):
- [ ] useTransactions.ts (all variants)
- [ ] useAccounts.ts
- [ ] useCategories.ts
- [ ] useBudgets.ts
- [ ] useAssets.ts
- [ ] useExchangeRates.ts

**Mutation Hooks** (all entities):
- [ ] useTransactionMutations.ts
- [ ] useAccountMutations.ts
- [ ] useCategoryMutations.ts
- [ ] useBudgetMutations.ts
- [ ] useAssetMutations.ts
- [ ] useExchangeRateMutations.ts

**Services**:
- [ ] dexieExport.service.ts (with LWW merge)
- [ ] cloudSync.service.ts (with soft delete sync)
- [ ] migration.service.ts

**Tests**:
- [ ] Write tests for all repositories
- [ ] Write tests for all hooks
- [ ] Write tests for all services
- [ ] Target: ≥80% coverage
- [ ] **Run tests, format, build** ✓

### Week 2: Update Components

#### 2.1: Remove Local Storage Option

**Why Remove Local Storage?**
- IndexedDB (via Dexie) provides much better local storage than localStorage
- Simplifies architecture - no need for multiple storage backends
- Cloud providers (OneDrive/Google Drive) handle cross-device sync
- Reduces maintenance burden and potential bugs

**Files to Delete**:
- [ ] Delete `src/services/storage/LocalStorageProvider.ts`
- [ ] Delete `src/services/storage/FilePickerService.ts`
- [ ] Delete `src/components/settings/FileSection.tsx` (if exists)

**Storage Service Updates** (`src/services/StorageService.ts`):
- [ ] Remove `StorageProvider.LOCAL` enum value
- [ ] Remove local storage logic from `loadFromStorage()`
- [ ] Remove local storage logic from `saveToStorage()`
- [ ] Update `getAvailableProviders()` to only return OneDrive and Google Drive
- [ ] Remove file picker initialization for local storage
- [ ] Update error messages to mention only cloud providers

**UI Component Updates**:
- [ ] Update `CloudProviderPicker.tsx` to only show OneDrive and Google Drive options
- [ ] Remove "Save to Device" or "Local Storage" buttons from settings
- [ ] Update welcome dialog/first-time setup to only offer cloud options
- [ ] Update file menu (if any) to remove local storage export/import options
- [ ] Update any help text or tooltips that mention local storage

**Type/Schema Updates**:
- [ ] Update `StorageProvider` enum in types to remove LOCAL
- [ ] Update any schemas that validate storage provider values
- [ ] Update AppContext interface to reflect cloud-only storage

**Migration Handling**:
- [ ] If user was using local storage before, prompt to upload to cloud
- [ ] Show migration dialog: "Local storage is no longer supported. Please choose a cloud provider to continue."
- [ ] Provide one-time export to JSON before requiring cloud setup
- [ ] Document migration path in user-facing changelog

**Tests to Update**:
- [ ] Remove tests for LocalStorageProvider
- [ ] Remove tests for FilePickerService
- [ ] Update StorageService tests to only test cloud providers
- [ ] Update component tests that reference local storage
- [ ] Add migration test for users upgrading from local storage

**Documentation Updates**:
- [ ] Update README to reflect cloud-only storage
- [ ] Update user guide/help docs
- [ ] Add changelog entry explaining the change and migration path

**Verification**:
- [ ] Search codebase for "local" "LOCAL" "localStorage" references: `grep -ri "localstorage\|storageprovider.local" src/`
- [ ] Verify no broken imports or references remain
- [ ] Test that app launches without local storage option
- [ ] **Run tests, format, build** ✓

---

#### 2.2: Migrate Components to Dexie Hooks

**Data Components** (migrate to Dexie hooks):
- [ ] Update all transaction components
- [ ] Update all account components
- [ ] Update all category components
- [ ] Update all budget components
- [ ] Update all asset components
- [ ] Update all report components
- [ ] Update dashboard & navigation

**Cleanup**:
- [ ] Delete `src/stores/` directory
- [ ] Remove Zustand from package.json
- [ ] Verify no imports remain: `grep -r "stores/\|LocalStorageProvider\|FilePickerService" src/`
- [ ] Update all component tests
- [ ] **Run tests, format, build** ✓

### Week 3: Testing & Release
**E2E Testing**:
- [ ] Test all CRUD operations
- [ ] Test all filters and queries
- [ ] Test all reports
- [ ] Test cloud sync (upload, download, merge)
- [ ] Test soft delete behavior
- [ ] Test LWW conflict resolution

**Performance Testing**:
- [ ] Test with 10k+ transactions
- [ ] Benchmark query performance
- [ ] Profile with React DevTools
- [ ] Optimize if needed

**Migration Testing**:
- First-Time Load Testing**:
- [ ] Test new user flow (welcome dialog)
- [ ] Test existing user (load from cloud to Dexie)
- [ ] Test with real user data
- [ ] Verify data integrity after first load
**Final Checks**:
- [ ] Run full test suite with coverage
- [ ] Build and check bundle size
- [ ] Test in production mode
- [ ] **Run tests, format, build** ✓

**Release**:
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Monitor for 48 hours
- [ ] Update documentation

---

## Rollback Strategy

### Pre-Merge Rollback
If issues during development:
1. Fix bugs on feature branch
2. Re-run tests
3. Continue until stable

### Post-Merge Rollback
If critical issues in production:

```bash
# Immediate rollback (<5 minutes)
git revert <merge-commit-hash>
git push origin main

# Deploy reverted version
npm run build
# Deploy to hosting
```

**Data Safety**:
- ✅ IndexedDB data stays on user's device
- ✅ JSON files in cloud unchanged
- ✅ Can export Dexie → JSON anytime
- ✅ Automatic backups in cloud

**Why Low Risk**:
- Local-first app (no server dependency)
- Data never leaves user's control
- Easy rollback with git
- Comprehensive testing before release

---

## Success Metrics

### Performance
- [ ] Query performance <50ms for 10k records
- [ ] Sync time <2s for typical dataset
- [ ] Initial load <1s
- [ ] Memory usage comparable to old system

### Quality
- [ ] Test coverage ≥80%
- [ ] Zero data loss during migration
- [ ] All features functional
- [ ] No regression bugs

### User Experience
- [ ] Faster perceived performance
- [ ] Better offline experience
- [ ] Simpler sync (no conflict dialogs)
- [ ] Smooth migration experience

---

## Key Differences from Old Plan

### What Changed
1. ✅ **Removed TanStack Query**: Not needed for local-first apps
2. ✅ **Simplified Sync**: LWW + soft deletes (no 3-way merge)
3. ✅ **Direct DB Access**: Using `useLiveQuery()` instead of cache layer
4. ✅ **Soft Deletes**: Prevents zombie records, enables delete sync
5. ✅ **Big Bang Approach**: 3 weeks vs 6-7 weeks

### Why These Changes Are Better
- **Simpler architecture**: Fewer moving parts
- **Less code**: No cache management, simpler conflict resolution
- **Better performance**: Direct DB access, no redundant caching
- **More predictable**: LWW is easier to understand than 3-way merge
- **Faster implementation**: Half the time

---

## Next Steps

1. ✅ Review this plan
2. ✅ Get team approval
3. ✅ Create feature branch
4. ✅ Start Phase 1: Build database schema
5. ⏭️ Follow checklist week by week

---

*Document Version: 2.0*
*Last Updated: 2026-01-24*
*Author: GitHub Copilot*
