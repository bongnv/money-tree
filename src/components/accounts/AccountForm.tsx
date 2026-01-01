import React, { useState } from 'react';
import {
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Button,
} from '@mui/material';
import type { Account } from '../../types/models';
import { AccountType } from '../../types/enums';
import { getAllCurrencies } from '../../utils/currency.utils';

interface AccountFormProps {
  account?: Account;
  onSubmit: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  account,
  onSubmit,
  onCancel,
}) => {
  const currencies = getAllCurrencies();
  const [formData, setFormData] = useState({
    name: account?.name || '',
    type: account?.type || AccountType.BANK_ACCOUNT,
    currencyId: account?.currencyId || 'usd',
    initialBalance: account?.initialBalance?.toString() || '0',
    description: account?.description || '',
    isActive: account?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }

    if (!formData.currencyId) {
      newErrors.currencyId = 'Currency is required';
    }

    const balance = parseFloat(formData.initialBalance);
    if (isNaN(balance)) {
      newErrors.initialBalance = 'Initial balance must be a valid number';
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
      type: formData.type,
      currencyId: formData.currencyId,
      initialBalance: parseFloat(formData.initialBalance),
      description: formData.description.trim() || undefined,
      isActive: formData.isActive,
    });
  };

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isActive: e.target.checked,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <TextField
        fullWidth
        label="Account Name"
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
        label="Account Type"
        value={formData.type}
        onChange={handleChange('type')}
        error={!!errors.type}
        helperText={errors.type}
        margin="normal"
        required
      >
        {Object.values(AccountType).map((type) => (
          <MenuItem key={type} value={type}>
            {type.replace('_', ' ').toUpperCase()}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        select
        label="Currency"
        value={formData.currencyId}
        onChange={handleChange('currencyId')}
        error={!!errors.currencyId}
        helperText={errors.currencyId}
        margin="normal"
        required
      >
        {currencies.map((currency) => (
          <MenuItem key={currency.id} value={currency.id}>
            {currency.code} - {currency.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Initial Balance"
        type="number"
        value={formData.initialBalance}
        onChange={handleChange('initialBalance')}
        error={!!errors.initialBalance}
        helperText={errors.initialBalance}
        margin="normal"
        required
        inputProps={{ step: '0.01' }}
      />

      <TextField
        fullWidth
        label="Description"
        value={formData.description}
        onChange={handleChange('description')}
        margin="normal"
        multiline
        rows={3}
      />

      <FormControlLabel
        control={
          <Switch
            checked={formData.isActive}
            onChange={handleSwitchChange}
          />
        }
        label="Active"
        sx={{ mt: 1 }}
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button type="submit" variant="contained" fullWidth>
          {account ? 'Update Account' : 'Create Account'}
        </Button>
        <Button onClick={onCancel} variant="outlined" fullWidth>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};
