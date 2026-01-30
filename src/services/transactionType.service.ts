import type { MoneyTreeDB } from '../db/database';
import type { TransactionType } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';

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

const softDelete = (entity: Partial<TransactionType>): Partial<TransactionType> => ({
  ...entity,
  isDeleted: true,
});

export class TransactionTypeService {
  constructor(
    private db: MoneyTreeDB,
    private syncMetadata: SyncMetadataService
  ) {}

  async getAll(): Promise<TransactionType[]> {
    return await this.db.transactionTypes.toArray();
  }

  async getById(id: string): Promise<TransactionType | undefined> {
    return await this.db.transactionTypes.get(id);
  }

  async getActive(): Promise<TransactionType[]> {
    return await this.db.transactionTypes
      .filter((type) => type.isActive === true && !type.isDeleted)
      .toArray();
  }

  async getByCategoryId(categoryId: string): Promise<TransactionType[]> {
    return await this.db.transactionTypes.where('categoryId').equals(categoryId).toArray();
  }

  async create(data: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const transactionType = addTimestamps({
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDeleted: false,
    });

    const id = await this.db.transactionTypes.add(transactionType as TransactionType);
    await this.syncMetadata.setLastModified();
    return id as string;
  }

  async update(
    id: string,
    data: Partial<Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await this.db.transactionTypes.get(id);
    if (!existing) {
      throw new Error(`TransactionType with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await this.db.transactionTypes.update(id, updated);
    await this.syncMetadata.setLastModified();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.transactionTypes.get(id);
    if (!existing) {
      throw new Error(`TransactionType with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await this.db.transactionTypes.update(id, deleted);
    await this.syncMetadata.setLastModified();
  }

  async archive(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  async unarchive(id: string): Promise<void> {
    await this.update(id, { isActive: true });
  }
}
