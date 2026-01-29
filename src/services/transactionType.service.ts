import { db } from '../db/database';
import type { TransactionType } from '../types/models';
import { syncMetadataService } from './syncMetadata.service';

const addTimestamps = (
  entity: Partial<TransactionType>,
  isUpdate = false
): Partial<TransactionType> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

export const transactionTypeService = {
  async getAll(): Promise<TransactionType[]> {
    return await db.transactionTypes.toArray();
  },

  async getById(id: string): Promise<TransactionType | undefined> {
    return await db.transactionTypes.get(id);
  },

  async getActive(): Promise<TransactionType[]> {
    return await db.transactionTypes.filter((type) => type.isActive === true).toArray();
  },

  async getByCategoryId(categoryId: string): Promise<TransactionType[]> {
    return await db.transactionTypes.where('categoryId').equals(categoryId).toArray();
  },

  async create(data: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const transactionType = addTimestamps({
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    const id = await db.transactionTypes.add(transactionType as TransactionType);
    await syncMetadataService.setLastModified(new Date().toISOString());
    return id as string;
  },

  async update(
    id: string,
    data: Partial<Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await db.transactionTypes.get(id);
    if (!existing) {
      throw new Error(`TransactionType with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await db.transactionTypes.update(id, updated);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },

  async delete(id: string): Promise<void> {
    await db.transactionTypes.delete(id);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },

  async archive(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  },

  async unarchive(id: string): Promise<void> {
    await this.update(id, { isActive: true });
  },
};
