import React from 'react';
import { TextField, Box, Button } from '@mui/material';
import type { Category } from '@/types/models';
import { useCategoryForm } from '@/hooks/categories/useCategoryForm';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<void>;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSubmit, onCancel }) => {
  const { formData, errors, setField, handleSubmit } = useCategoryForm({
    category,
    onSubmit,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <Box component="form" onSubmit={handleFormSubmit} noValidate>
      <TextField
        fullWidth
        label="Category Name"
        value={formData.name}
        onChange={(e) => setField('name', e.target.value)}
        error={!!errors.name}
        helperText={errors.name || 'Categories are organizational labels'}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        label="Description"
        value={formData.description || ''}
        onChange={(e) => setField('description', e.target.value)}
        margin="normal"
        multiline
        rows={3}
      />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          {category ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};
