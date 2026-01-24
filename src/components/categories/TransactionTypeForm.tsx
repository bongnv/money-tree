import React, { useState } from 'react';
import { TextField, MenuItem, Box, Button } from '@mui/material';
import type { TransactionType, Category } from '../../types/models';
import { Group } from '../../types/enums';
import { useAccounts } from '../../hooks/queries/useAccounts';

interface TransactionTypeFormProps {
  transactionType?: TransactionType;
  categories: Category[];
  categoryId?: string;
  onSubmit: (transactionType: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const TransactionTypeForm: React.FC<TransactionTypeFormProps> = ({
  transactionType,
  categories,
  categoryId,
  onSubmit,
  onCancel,
}) => {
  const accounts = useAccounts();

  const [formData, setFormData] = useState({
    name: transactionType?.name || '',
    categoryId: transactionType?.categoryId || categoryId || '',
    group: transactionType?.group || Group.EXPENSE,
    description: transactionType?.description || '',
    defaultFromAccountId: transactionType?.defaultFromAccountId || '',
    defaultToAccountId: transactionType?.defaultToAccountId || '',
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
      categoryId: formData.categoryId,
      group: formData.group,
      description: formData.description.trim() || undefined,
      defaultFromAccountId: formData.defaultFromAccountId || undefined,
      defaultToAccountId: formData.defaultToAccountId || undefined,
    });
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      // If changing group from TRANSFER to something else, clear default accounts
      if (field === 'group' && newValue !== Group.TRANSFER) {
        setFormData({
          ...formData,
          group: newValue as Group,
          defaultFromAccountId: '',
          defaultToAccountId: '',
        });
      } else if (field === 'group') {
        setFormData({
          ...formData,
          group: newValue as Group,
        });
      } else {
        setFormData({
          ...formData,
          [field]: newValue,
        });
      }

      if (errors[field]) {
        setErrors({ ...errors, [field]: '' });
      }
    };

  const getGroupHelperText = (group: Group): string => {
    switch (group) {
      case Group.INCOME:
        return 'Money received into an account';
      case Group.EXPENSE:
        return 'Money spent from an account';
      case Group.TRANSFER:
        return 'Money moved between accounts';
      case Group.ASSET_PURCHASE:
        return 'Buying or depositing into an asset (e.g., buying stocks, depositing to property)';
      case Group.ASSET_SALE:
        return 'Selling or withdrawing from an asset (e.g., selling stocks, withdrawing from property)';
      default:
        return '';
    }
  };

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
        label="Group"
        value={formData.group}
        onChange={handleChange('group')}
        error={!!errors.group}
        helperText={errors.group || getGroupHelperText(formData.group)}
        margin="normal"
        required
      >
        <MenuItem value={Group.INCOME}>Income</MenuItem>
        <MenuItem value={Group.EXPENSE}>Expense</MenuItem>
        <MenuItem value={Group.TRANSFER}>Transfer</MenuItem>
        <MenuItem value={Group.ASSET_PURCHASE}>Asset Purchase</MenuItem>
        <MenuItem value={Group.ASSET_SALE}>Asset Sale</MenuItem>
      </TextField>

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
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
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

      {formData.group === Group.TRANSFER && (
        <>
          <TextField
            fullWidth
            select
            label="Default From Account"
            value={formData.defaultFromAccountId}
            onChange={handleChange('defaultFromAccountId')}
            margin="normal"
            helperText="Optional: Pre-set the 'from' account for this transaction type"
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {(accounts || [])
              .filter((account) => account.isActive)
              .map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Default To Account"
            value={formData.defaultToAccountId}
            onChange={handleChange('defaultToAccountId')}
            margin="normal"
            helperText="Optional: Pre-set the 'to' account for this transaction type"
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {(accounts || [])
              .filter((account) => account.isActive)
              .map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
          </TextField>
        </>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          {transactionType ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};
