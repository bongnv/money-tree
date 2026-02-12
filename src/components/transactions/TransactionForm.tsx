import React, { useMemo } from 'react';
import { Box, Button, MenuItem, Alert, Autocomplete, TextField } from '@mui/material';
import { FormTextField } from '@/components/common/FormTextField';
import { FormDatePicker } from '@/components/common/FormDatePicker';
import type { Transaction, Account, TransactionType, Category } from '@/types/models';
import { Group } from '@/types/enums';
import { useStore } from '@/contexts/StoreContext';
import { useTransactionForm } from '@/hooks/transactions/useTransactionForm';

interface TransactionFormProps {
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  transactionTypes: TransactionType[];
  onSubmit: (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => Promise<void>;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  accounts,
  categories,
  transactionTypes,
  onSubmit,
  onCancel,
}) => {
  const { formData, errors, setField, handleSubmit } = useTransactionForm({
    transaction,
    onSubmit,
  });

  const { assets: manualAssets } = useStore();

  // Derive selected group from transaction type
  const selectedGroup = useMemo(() => {
    if (formData.transactionTypeId) {
      const transactionType = transactionTypes.find((tt) => tt.id === formData.transactionTypeId);
      if (transactionType) {
        return transactionType.group;
      }
    }
    return null;
  }, [formData.transactionTypeId, transactionTypes]);

  // Get selected transaction type
  const selectedTransactionType = useMemo(() => {
    return transactionTypes.find((tt) => tt.id === formData.transactionTypeId);
  }, [formData.transactionTypeId, transactionTypes]);

  // Check if accounts are set by defaults (and should be disabled)
  const fromAccountIsDefault = selectedTransactionType?.defaultFromAccountId;
  const toAccountIsDefault = selectedTransactionType?.defaultToAccountId;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  // Group transaction types by category
  const groupedTransactionTypes = categories
    .map((category) => ({
      category,
      types: transactionTypes.filter(
        (tt) => tt.categoryId === category.id && tt.isActive !== false
      ),
    }))
    .filter((group) => group.types.length > 0);

  // Flatten transaction types with category labels for autocomplete
  const transactionTypeOptions = useMemo(() => {
    const options: Array<{ id: string; name: string; categoryName: string }> = [];
    groupedTransactionTypes.forEach(({ category, types }) => {
      types.forEach((type) => {
        options.push({
          id: type.id,
          name: type.name,
          categoryName: category.name,
        });
      });
    });
    return options;
  }, [groupedTransactionTypes]);

  const selectedTransactionTypeOption = transactionTypeOptions.find(
    (opt) => opt.id === formData.transactionTypeId
  );

  const activeAccounts = accounts.filter((a) => a.isActive);

  // Determine which fields to show based on selected group
  const showFromAccount =
    selectedGroup === Group.EXPENSE ||
    selectedGroup === Group.TRANSFER ||
    selectedGroup === Group.ASSET_PURCHASE;
  const showToAccount =
    selectedGroup === Group.INCOME ||
    selectedGroup === Group.TRANSFER ||
    selectedGroup === Group.ASSET_SALE;
  const showFromAsset = selectedGroup === Group.ASSET_SALE;
  const showToAsset = selectedGroup === Group.ASSET_PURCHASE;

  return (
    <Box component="form" onSubmit={handleFormSubmit} noValidate>
      {selectedGroup === Group.ASSET_PURCHASE && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Asset Purchase:</strong> Buying or depositing into an asset. Money flows from an
          account into the asset, increasing its value.
        </Alert>
      )}
      {selectedGroup === Group.ASSET_SALE && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Asset Sale:</strong> Selling or withdrawing from an asset. Money flows from the
          asset into an account, decreasing its value.
        </Alert>
      )}

      <FormDatePicker
        label="Date"
        value={formData.date}
        onChange={(date) => setField('date', date)}
        error={!!errors.date}
        helperText={errors.date}
        required
      />

      <FormTextField
        label="Description"
        value={formData.description}
        onChange={(e) => setField('description', e.target.value)}
        error={!!errors.description}
        helperText={errors.description}
      />

      <FormTextField
        label="Amount"
        type="number"
        value={formData.amount}
        onChange={(e) => setField('amount', e.target.value)}
        error={!!errors.amount}
        helperText={errors.amount}
        required
        inputProps={{ step: 0.01 }}
      />

      <Autocomplete
        options={transactionTypeOptions}
        getOptionLabel={(option) => option.name}
        groupBy={(option) => option.categoryName}
        value={selectedTransactionTypeOption || null}
        onChange={(_event, newValue) => {
          const newId = newValue?.id || '';
          const newTransactionType = transactionTypes.find((tt) => tt.id === newId);

          // Update transaction type ID
          setField('transactionTypeId', newId);

          // Apply default accounts when transaction type changes
          if (newTransactionType) {
            if (newTransactionType.defaultFromAccountId) {
              setField('fromAccountId', newTransactionType.defaultFromAccountId);
            }
            if (newTransactionType.defaultToAccountId) {
              setField('toAccountId', newTransactionType.defaultToAccountId);
            }
          }
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Transaction Type"
            required
            error={!!errors.transactionTypeId}
            helperText={errors.transactionTypeId}
            margin="normal"
            fullWidth
          />
        )}
      />

      {showFromAccount && (
        <FormTextField
          select
          label="From Account"
          value={formData.fromAccountId}
          onChange={(e) => setField('fromAccountId', e.target.value)}
          error={!!errors.fromAccountId}
          helperText={
            fromAccountIsDefault ? 'Account is set by transaction type' : errors.fromAccountId
          }
          required
          disabled={!!fromAccountIsDefault}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {activeAccounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.name}
            </MenuItem>
          ))}
        </FormTextField>
      )}

      {showFromAsset && (
        <FormTextField
          select
          label="From Asset"
          value={formData.fromAssetId}
          onChange={(e) => setField('fromAssetId', e.target.value)}
          error={!!errors.fromAssetId}
          helperText={
            errors.fromAssetId ||
            'Select the asset you are selling or withdrawing from. Asset value will decrease.'
          }
          required
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {(manualAssets || []).map((asset) => (
            <MenuItem key={asset.id} value={asset.id}>
              {asset.name}
            </MenuItem>
          ))}
        </FormTextField>
      )}

      {showToAccount && (
        <FormTextField
          select
          label="To Account"
          value={formData.toAccountId}
          onChange={(e) => setField('toAccountId', e.target.value)}
          error={!!errors.toAccountId}
          helperText={
            toAccountIsDefault ? 'Account is set by transaction type' : errors.toAccountId
          }
          required
          disabled={!!toAccountIsDefault}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {activeAccounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.name}
            </MenuItem>
          ))}
        </FormTextField>
      )}

      {showToAsset && (
        <FormTextField
          select
          label="To Asset"
          value={formData.toAssetId}
          onChange={(e) => setField('toAssetId', e.target.value)}
          error={!!errors.toAssetId}
          helperText={
            errors.toAssetId ||
            'Select the asset you are purchasing or depositing into. Asset value will increase.'
          }
          required
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {(manualAssets || []).map((asset) => (
            <MenuItem key={asset.id} value={asset.id}>
              {asset.name}
            </MenuItem>
          ))}
        </FormTextField>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          {transaction ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};
