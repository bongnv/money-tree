import { TextField, MenuItem, Box, Button } from '@mui/material';
import React from 'react';
import { useAccountForm } from '@/hooks/accounts/useAccountForm';
import { AccountType, CurrencyCode } from '@/types/enums';
import type { Account } from '@/types/models';
import { getAllCurrencies } from '@/utils/currency.utils';

interface AccountFormProps {
  account?: Account;
  onSubmit: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({ account, onSubmit, onCancel }) => {
  const currencies = getAllCurrencies();
  const { formData, errors, isSubmitting, setField, handleSubmit } = useAccountForm({
    account,
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
        label="Account Name"
        value={formData.name}
        onChange={(e) => setField('name', e.target.value)}
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
        onChange={(e) => setField('type', e.target.value as AccountType)}
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
        value={formData.currencyCode}
        onChange={(e) => setField('currencyCode', e.target.value as CurrencyCode)}
        error={!!errors.currencyCode}
        helperText={errors.currencyCode}
        margin="normal"
        required
      >
        {currencies.map((currency) => (
          <MenuItem key={currency.code} value={currency.code}>
            {currency.code} - {currency.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Initial Balance"
        type="number"
        value={formData.initialBalance}
        onChange={(e) => setField('initialBalance', e.target.value)}
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
        onChange={(e) => setField('description', e.target.value)}
        margin="normal"
        multiline
        rows={3}
      />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {account ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};
