import type { MoneyTreeDB } from '../db/database';
import type { Category } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';
import { generateId } from '../utils/id.utils';

const addTimestamps = (entity: Partial<Category>, isUpdate = false): Partial<Category> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

const softDelete = (entity: Partial<Category>): Partial<Category> => ({
  ...entity,
  isDeleted: true,
});

export class CategoryService {
  constructor(
    private db: MoneyTreeDB,
    private syncMetadata: SyncMetadataService
  ) {}

  async getAll(): Promise<Category[]> {
    return await this.db.categories.toArray();
  }

  async getById(id: string): Promise<Category | undefined> {
    return await this.db.categories.get(id);
  }

  async getActive(): Promise<Category[]> {
    return await this.db.categories.filter((category) => !category.isDeleted).toArray();
  }

  async create(
    data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<string> {
    const id = generateId();
    const category = addTimestamps({
      ...data,
      id,
      isDeleted: false,
    });

    await this.db.categories.add(category as Category);
    await this.syncMetadata.setLastModified();
    return id;
  }

  async update(
    id: string,
    data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await this.db.categories.get(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await this.db.categories.update(id, updated);
    await this.syncMetadata.setLastModified();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.categories.get(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await this.db.categories.update(id, deleted);
    await this.syncMetadata.setLastModified();
  }
}
