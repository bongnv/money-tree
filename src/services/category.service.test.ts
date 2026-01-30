import { CategoryService } from './category.service';
import { db } from '../db/database';
import type { Category } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';

const mockSyncMetadataService = {
  setLastModified: jest.fn(),
} as unknown as SyncMetadataService;

jest.mock('../db/database', () => ({
  db: {
    categories: {
      toArray: jest.fn(),
      get: jest.fn(),
      filter: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
    },
    syncMetadata: {
      put: jest.fn(),
      get: jest.fn(),
    },
  },
}));

describe('categoryService', () => {
  let categoryService: CategoryService;
  const mockCategory: Category = {
    id: '1',
    name: 'Test Category',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    categoryService = new CategoryService(db, mockSyncMetadataService);
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
      };
      (db.categories.add as jest.Mock).mockResolvedValue('2');

      const id = await categoryService.create(newCategory);

      expect(typeof id).toBe('string');
      expect(id).toBeTruthy();
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

      await categoryService.update('1', { name: 'Updated Category' });

      expect(db.categories.update).toHaveBeenCalledWith(
        '1',
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

      await categoryService.delete('1');

      expect(db.categories.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          isDeleted: true,
        })
      );
    });
  });

  describe('validateCategoryForm', () => {
    it('should return no errors for valid form data', () => {
      const formData = {
        name: 'Groceries',
      };

      const errors = categoryService.validateCategoryForm(formData);
      expect(errors).toEqual([]);
    });

    it('should return error for empty name', () => {
      const formData = {
        name: '   ',
      };

      const errors = categoryService.validateCategoryForm(formData);
      expect(errors).toContainEqual({ field: 'name', message: 'Category name is required' });
    });

    it('should return error for missing name', () => {
      const formData = {
        name: '',
      };

      const errors = categoryService.validateCategoryForm(formData);
      expect(errors).toContainEqual({ field: 'name', message: 'Category name is required' });
    });
  });

  describe('transformFormToCategory', () => {
    it('should transform form data to category object', () => {
      const formData = {
        name: '  Groceries  ',
      };

      const result = categoryService.transformFormToCategory(formData);

      expect(result).toEqual({
        name: 'Groceries',
      });
    });

    it('should trim whitespace from name', () => {
      const formData = {
        name: '  Dining Out  ',
      };

      const result = categoryService.transformFormToCategory(formData);

      expect(result.name).toBe('Dining Out');
    });
  });
});
