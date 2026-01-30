import type { MoneyTreeDB } from '../db/database';
import type { Budget } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';
import { generateId } from '../utils/id.utils';

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

export class BudgetService {
  constructor(
    private db: MoneyTreeDB,
    private syncMetadata: SyncMetadataService
  ) {}

  async getAll(): Promise<Budget[]> {
    return await this.db.budgets.toArray();
  }

  async getById(id: string): Promise<Budget | undefined> {
    return await this.db.budgets.get(id);
  }

  async getActive(): Promise<Budget[]> {
    return await this.db.budgets.filter((budget) => !budget.isDeleted).toArray();
  }

  async create(
    data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<string> {
    const id = generateId();
    const budget = addTimestamps({
      ...data,
      id,
      isDeleted: false,
    });

    await this.db.budgets.add(budget as Budget);
    await this.syncMetadata.setLastModified();
    return id;
  }

  async update(
    id: string,
    data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await this.db.budgets.get(id);
    if (!existing) {
      throw new Error(`Budget with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await this.db.budgets.update(id, updated);
    await this.syncMetadata.setLastModified();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.budgets.get(id);
    if (!existing) {
      throw new Error(`Budget with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await this.db.budgets.update(id, deleted);
    await this.syncMetadata.setLastModified();
  }
}
