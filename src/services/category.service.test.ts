import { categoryService } from './category.service';
import { db } from '../db/database';

jest.mock('./syncMetadata.service', () => ({
  syncMetadataService: {
    setLastModified: jest.fn(),
  },
}));

import type { Category } from '../types/models';

jest.mock('../db/database', () => ({
  db: {
    categories: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
    },
  },
  syncMetadata: {
    setLastModified: jest.fn(),
  },
}));

describe('categoryService', () => {
  const mockCategory: Category = {
    id: 1,
    name: 'Test Category',
    type: 'expense',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all categories', async () => {
      (db.categories.toArray as jest.Mock).mockResolvedValue([mockCategory]);

      const result = await categoryService.getAll();

      expect(result).toEqual([mockCategory]);
    });
  });

  describe('getActive', () => {
    it('should return only non-deleted categories', async () => {
      const mockFilter = {
        toArray: jest.fn().mockResolvedValue([mockCategory]),
      };
      (db.categories.filter as jest.Mock).mockReturnValue(mockFilter);

      const result = await categoryService.getActive();

      expect(result).toEqual([mockCategory]);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const newCategory = {
        name: 'New Category',
        type: 'income' as const,
      };
      (db.categories.add as jest.Mock).mockResolvedValue(2);

      const id = await categoryService.create(newCategory);

      expect(id).toBe(2);
      expect(db.categories.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newCategory,
          isDeleted: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      (db.categories.get as jest.Mock).mockResolvedValue(mockCategory);
      (db.categories.update as jest.Mock).mockResolvedValue(1);

      await categoryService.update(1, { name: 'Updated Category' });

      expect(db.categories.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Updated Category',
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a category', async () => {
      (db.categories.get as jest.Mock).mockResolvedValue(mockCategory);
      (db.categories.update as jest.Mock).mockResolvedValue(1);

      await categoryService.delete(1);

      expect(db.categories.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isDeleted: true,
        })
      );
    });
  });
});
