import { db } from '../db/database';
import type { Budget } from '../types/models';
import { syncMetadataService } from './syncMetadata.service';

const addTimestamps = (entity: Partial<Budget>, isUpdate = false): Partial<Budget> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

const softDelete = (entity: Partial<Budget>): Partial<Budget> => ({
  ...entity,
  isDeleted: true,
});

export const budgetService = {
  async getAll(): Promise<Budget[]> {
    return await db.budgets.toArray();
  },

  async getById(id: string): Promise<Budget | undefined> {
    return await db.budgets.get(id);
  },

  async getActive(): Promise<Budget[]> {
    return await db.budgets.filter((budget) => !budget.isDeleted).toArray();
  },

  async create(
    data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<string> {
    const budget = addTimestamps({
      ...data,
      isDeleted: false,
    });

    const id = await db.budgets.add(budget as Budget);
    await syncMetadataService.setLastModified(new Date().toISOString());
    return id as string;
  },

  async update(
    id: string,
    data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await db.budgets.get(id);
    if (!existing) {
      throw new Error(`Budget with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await db.budgets.update(id, updated);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },

  async delete(id: string): Promise<void> {
    const existing = await db.budgets.get(id);
    if (!existing) {
      throw new Error(`Budget with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await db.budgets.update(id, deleted);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },
};
