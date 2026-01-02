import React, { useState } from 'react';
import { TextField, MenuItem, Box, Button } from '@mui/material';
import type { TransactionType, Category } from '../../types/models';

interface TransactionTypeFormProps {
  transactionType?: TransactionType;
  categories: Category[];
  onSubmit: (transactionType: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const TransactionTypeForm: React.FC<TransactionTypeFormProps> = ({
  transactionType,
  categories,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: transactionType?.name || '',
    categoryId: transactionType?.categoryId || '',
    description: transactionType?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Transaction type name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
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
      categoryId: formData.categoryId,
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

  // Group categories by group
  const groupedCategories = categories.reduce(
    (acc, category) => {
      if (!acc[category.group]) {
        acc[category.group] = [];
      }
      acc[category.group].push(category);
      return acc;
    },
    {} as Record<string, Category[]>
  );

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <TextField
        fullWidth
        label="Transaction Type Name"
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
        label="Category"
        value={formData.categoryId}
        onChange={handleChange('categoryId')}
        error={!!errors.categoryId}
        helperText={errors.categoryId}
        margin="normal"
        required
      >
        {Object.entries(groupedCategories).map(([group, cats]) => [
          <MenuItem key={`header-${group}`} disabled sx={{ fontWeight: 'bold', opacity: 1 }}>
            {group.toUpperCase()}
          </MenuItem>,
          ...cats.map((category) => (
            <MenuItem key={category.id} value={category.id} sx={{ pl: 4 }}>
              {category.name}
            </MenuItem>
          )),
        ])}
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
          {transactionType ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};
