import React, { useState } from 'react';
import { TextField, MenuItem, Box, Button } from '@mui/material';
import type { Category } from '../../types/models';
import { Group } from '../../types/enums';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    group: category?.group || Group.EXPENSE,
    description: category?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.group) {
      newErrors.group = 'Group is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      group: formData.group,
      description: formData.description.trim() || undefined,
    });
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({
        ...formData,
        [field]: e.target.value,
      });
      if (errors[field]) {
        setErrors({ ...errors, [field]: '' });
      }
    };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <TextField
        fullWidth
        label="Category Name"
        value={formData.name}
        onChange={handleChange('name')}
        error={!!errors.name}
        helperText={errors.name}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        select
        label="Group"
        value={formData.group}
        onChange={handleChange('group')}
        error={!!errors.group}
        helperText={errors.group}
        margin="normal"
        required
      >
        <MenuItem value={Group.INCOME}>Income</MenuItem>
        <MenuItem value={Group.EXPENSE}>Expense</MenuItem>
        <MenuItem value={Group.TRANSFER}>Transfer</MenuItem>
        <MenuItem value={Group.INVESTMENT}>Investment</MenuItem>
      </TextField>

      <TextField
        fullWidth
        label="Description"
        value={formData.description}
        onChange={handleChange('description')}
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
