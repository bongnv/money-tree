import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import type { Category } from '../../types/models';
import { CategoryForm } from './CategoryForm';

interface CategoryDialogProps {
  open: boolean;
  category?: Category;
  onClose: () => void;
  onSubmit: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
}

export const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  category,
  onClose,
  onSubmit,
}) => {
  const handleSubmit = (
    categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => {
    onSubmit(categoryData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{category ? 'Edit Category' : 'Add Category'}</DialogTitle>
      <DialogContent>
        <CategoryForm category={category} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
};
