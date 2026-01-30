import type { MoneyTreeDB } from '../db/database';
import { db } from '../db/database';
import type { Account } from '../types/models';

const addTimestamps = (entity: Partial<Account>, isUpdate = false): Partial<Account> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

const softDelete = (entity: Partial<Account>): Partial<Account> => ({
  ...entity,
  isDeleted: true,
});

export class AccountService {
  constructor(private db: MoneyTreeDB) {}

  async getAll(): Promise<Account[]> {
    return await this.db.accounts.toArray();
  }

  async getById(id: string): Promise<Account | undefined> {
    return await this.db.accounts.get(id);
  }

  async getActive(): Promise<Account[]> {
    return await this.db.accounts
      .filter((account) => account.isActive && !account.isDeleted)
      .toArray();
  }

  async create(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const account = addTimestamps({
      ...data,
      isActive: data.isActive ?? true,
      isDeleted: false,
    });

    const id = await this.db.accounts.add(account as Account);
    return id as string;
  }

  async update(
    id: string,
    data: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await this.db.accounts.get(id);
    if (!existing) {
      throw new Error(`Account with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await this.db.accounts.update(id, updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.accounts.get(id);
    if (!existing) {
      throw new Error(`Account with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await this.db.accounts.update(id, deleted);
  }

  async archive(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  async unarchive(id: string): Promise<void> {
    await this.update(id, { isActive: true });
  }
}

// Singleton instance for backward compatibility
export const accountService = new AccountService(db);
