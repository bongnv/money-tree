import type { MoneyTreeDB } from '../db/database';
import { db } from '../db/database';
import type { Category } from '../types/models';

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
  constructor(private db: MoneyTreeDB) {}

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
    const category = addTimestamps({
      ...data,
      isDeleted: false,
    });

    const id = await this.db.categories.add(category as Category);
    return id as string;
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
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.categories.get(id);
    if (!existing) {
      throw new Error(`Category with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await this.db.categories.update(id, deleted);
  }
}

// Singleton instance for backward compatibility
export const categoryService = new CategoryService(db);
