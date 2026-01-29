import { db } from '../db/database';
import type { Transaction } from '../types/models';
import { syncMetadataService } from './syncMetadata.service';

const addTimestamps = (entity: Partial<Transaction>, isUpdate = false): Partial<Transaction> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

const softDelete = (entity: Partial<Transaction>): Partial<Transaction> => ({
  ...entity,
  isDeleted: true,
});

export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    return await db.transactions.toArray();
  },

  async getById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  },

  async getActive(): Promise<Transaction[]> {
    return await db.transactions.filter((txn) => !txn.isDeleted).toArray();
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return await db.transactions.where('date').between(startDate, endDate, true, true).toArray();
  },

  async create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<string> {
    const transaction = addTimestamps({
      ...data,
      isDeleted: false,
    });

    const id = await db.transactions.add(transaction as Transaction);
    await syncMetadataService.setLastModified(new Date().toISOString());
    return id as string;
  },

  async update(
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await db.transactions.get(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await db.transactions.update(id, updated);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },

  async delete(id: string): Promise<void> {
    const existing = await db.transactions.get(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await db.transactions.update(id, deleted);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },
};
