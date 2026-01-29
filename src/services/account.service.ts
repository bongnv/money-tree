import { db } from '../db/database';
import type { Account } from '../types/models';
import { syncMetadataService } from './syncMetadata.service';

const addTimestamps = (entity: Partial<Account>, isUpdate = false): Partial<Account> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

export const accountService = {
  async getAll(): Promise<Account[]> {
    return await db.accounts.toArray();
  },

  async getById(id: string): Promise<Account | undefined> {
    return await db.accounts.get(id);
  },

  async getActive(): Promise<Account[]> {
    return await db.accounts.filter((account) => account.isActive).toArray();
  },

  async create(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const account = addTimestamps({
      ...data,
      isActive: data.isActive ?? true,
    });

    const id = await db.accounts.add(account as Account);
    syncMetadataService.setLastModified(new Date().toISOString());
    return id as string;
  },

  async update(
    id: string,
    data: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await db.accounts.get(id);
    if (!existing) {
      throw new Error(`Account with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await db.accounts.update(id, updated);
    syncMetadataService.setLastModified(new Date().toISOString());
  },

  async delete(id: string): Promise<void> {
    await db.accounts.delete(id);
    syncMetadataService.setLastModified(new Date().toISOString());
  },

  async archive(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  },

  async unarchive(id: string): Promise<void> {
    await this.update(id, { isActive: true });
  },
};
