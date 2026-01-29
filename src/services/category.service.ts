import { db } from '../db/database';
import type { Category } from '../types/models';
import { syncMetadataService } from './syncMetadata.service';

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

export const categoryService = {
  async getAll(): Promise<Category[]> {
    return await db.categories.toArray();
  },

  async getById(id: string): Promise<Category | undefined> {
    return await db.categories.get(id);
  },

  async getActive(): Promise<Category[]> {
    return await db.categories.filter((category) => !category.isDeleted).toArray();
  },

  async create(
    data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<string> {
    const category = addTimestamps({
      ...data,
      isDeleted: false,
    });

    const id = await db.categories.add(category as Category);
    await syncMetadataService.setLastModified(new Date().toISOString());
    return id as string;
  },

  async update(
    id: string,
    data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await db.categories.get(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await db.categories.update(id, updated);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },

  async delete(id: string): Promise<void> {
    const existing = await db.categories.get(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await db.categories.update(id, deleted);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },
};
