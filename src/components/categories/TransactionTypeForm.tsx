import { TextField, MenuItem, Box, Button } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Group } from '@/types/enums';
import type { TransactionType, Category } from '@/types/models';

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
  const { accounts } = useStore();
  const activeAccounts = useMemo(() => accounts.filter((acc) => acc.isActive), [accounts]);

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
      isActive: true,
      isDeleted: false,
    });
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      // If changing group, clear incompatible default accounts
      if (field === 'group') {
        const newGroup = newValue as Group;
        const updates: Partial<typeof formData> = { group: newGroup };

        // Clear default accounts based on new group
        const supportsFromAccount =
          newGroup === Group.EXPENSE ||
          newGroup === Group.TRANSFER ||
          newGroup === Group.ASSET_PURCHASE;
        const supportsToAccount =
          newGroup === Group.INCOME || newGroup === Group.TRANSFER || newGroup === Group.ASSET_SALE;

        if (!supportsFromAccount) {
          updates.defaultFromAccountId = '';
        }
        if (!supportsToAccount) {
          updates.defaultToAccountId = '';
        }

        setFormData({
          ...formData,
          ...updates,
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

      {(formData.group === Group.EXPENSE ||
        formData.group === Group.TRANSFER ||
        formData.group === Group.ASSET_PURCHASE) && (
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
          {activeAccounts
            .filter((account) => account.isActive)
            .map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}
              </MenuItem>
            ))}
        </TextField>
      )}

      {(formData.group === Group.INCOME ||
        formData.group === Group.TRANSFER ||
        formData.group === Group.ASSET_SALE) && (
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
          {activeAccounts
            .filter((account) => account.isActive)
            .map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}
              </MenuItem>
            ))}
        </TextField>
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
