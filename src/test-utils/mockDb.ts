/**
 * Mock Database utilities for testing
 * Provides in-memory mock implementations of Dexie tables
 */

export class MockTable<T extends { id: string }> {
  private data: Map<string, T> = new Map();

  async toArray(): Promise<T[]> {
    return Array.from(this.data.values());
  }

  async get(id: string): Promise<T | undefined> {
    return this.data.get(id);
  }

  async add(item: T): Promise<string> {
    this.data.set(item.id, item);
    return item.id;
  }

  async update(id: string, changes: Partial<T>): Promise<number> {
    const existing = this.data.get(id);
    if (!existing) return 0;

    this.data.set(id, { ...existing, ...changes });
    return 1;
  }

  async delete(id: string): Promise<void> {
    this.data.delete(id);
  }

  async put(item: T): Promise<string> {
    this.data.set(item.id, item);
    return item.id;
  }

  async bulkAdd(items: T[]): Promise<string[]> {
    items.forEach((item) => this.data.set(item.id, item));
    return items.map((i) => i.id);
  }

  async bulkPut(items: T[]): Promise<string[]> {
    items.forEach((item) => this.data.set(item.id, item));
    return items.map((i) => i.id);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  // Helper for filtering
  filter(predicate: (item: T) => boolean) {
    return {
      toArray: async () => {
        return Array.from(this.data.values()).filter(predicate);
      },
    };
  }

  // Test helpers
  setData(items: T[]): void {
    this.data.clear();
    items.forEach((item) => this.data.set(item.id, item));
  }

  getData(): T[] {
    return Array.from(this.data.values());
  }

  count(): number {
    return this.data.size;
  }
}

/**
 * Mock database with all tables
 */
export class MockDB {
  accounts = new MockTable();
  transactions = new MockTable();
  categories = new MockTable();
  transactionTypes = new MockTable();
  budgets = new MockTable();
  manualAssets = new MockTable();
  exchangeRates = new MockTable();
  syncMetadata = new MockTable();

  resetAll(): void {
    this.accounts.clear();
    this.transactions.clear();
    this.categories.clear();
    this.transactionTypes.clear();
    this.budgets.clear();
    this.manualAssets.clear();
    this.exchangeRates.clear();
    this.syncMetadata.clear();
  }
}
