import React, { useState, useMemo } from 'react';
import { Box, Button, MenuItem, Alert, Autocomplete, TextField } from '@mui/material';
import { FormTextField } from '../common/FormTextField';
import type { Transaction, Account, TransactionType, Category } from '../../types/models';
import { Group } from '../../types/enums';
import { toDateString, getTodayDate } from '../../utils/date.utils';
import { validationService, ValidationError } from '../../services/validation.service';
import { useAssetStore } from '../../stores/useAssetStore';

interface TransactionFormProps {
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  transactionTypes: TransactionType[];
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
  const [formData, setFormData] = useState({
    date: transaction?.date || getTodayDate(),
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    transactionTypeId: transaction?.transactionTypeId || '',
    fromAccountId: transaction?.fromAccountId || '',
    toAccountId: transaction?.toAccountId || '',
    fromAssetId: transaction?.fromAssetId || '',
    toAssetId: transaction?.toAssetId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { manualAssets } = useAssetStore();

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

  const validate = (): boolean => {
    const transactionType = transactionTypes.find((tt) => tt.id === formData.transactionTypeId);
    const fromAccount = formData.fromAccountId
      ? accounts.find((a) => a.id === formData.fromAccountId)
      : undefined;
    const toAccount = formData.toAccountId
      ? accounts.find((a) => a.id === formData.toAccountId)
      : undefined;

    const partialTransaction: Partial<Transaction> = {
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      transactionTypeId: formData.transactionTypeId || undefined,
      fromAccountId: formData.fromAccountId || undefined,
      toAccountId: formData.toAccountId || undefined,
      fromAssetId: formData.fromAssetId || undefined,
      toAssetId: formData.toAssetId || undefined,
    };

    const validationErrors = validationService.validateTransaction(
      partialTransaction,
      transactionType,
      fromAccount,
      toAccount
    );

    const errorMap: Record<string, string> = {};
    validationErrors.forEach((err: ValidationError) => {
      errorMap[err.field] = err.message;
    });

    setErrors(errorMap);
    return validationErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      date: formData.date,
      description: formData.description.trim() || undefined,
      amount: parseFloat(formData.amount),
      transactionTypeId: formData.transactionTypeId,
      fromAccountId: formData.fromAccountId || undefined,
      toAccountId: formData.toAccountId || undefined,
      fromAssetId: formData.fromAssetId || undefined,
      toAssetId: formData.toAssetId || undefined,
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

  const selectedTransactionType = transactionTypeOptions.find(
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
    <Box component="form" onSubmit={handleSubmit} noValidate>
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

      <FormTextField
        label="Date"
        type="date"
        value={formData.date}
        onChange={(e) => {
          const dateStr = toDateString(e.target.value);
          setFormData({ ...formData, date: dateStr });
          if (errors.date) {
            setErrors({ ...errors, date: '' });
          }
        }}
        error={!!errors.date}
        helperText={errors.date}
        required
        InputLabelProps={{ shrink: true }}
      />

      <FormTextField
        label="Description"
        value={formData.description}
        onChange={handleChange('description')}
        error={!!errors.description}
        helperText={errors.description}
      />

      <FormTextField
        label="Amount"
        type="number"
        value={formData.amount}
        onChange={handleChange('amount')}
        error={!!errors.amount}
        helperText={errors.amount}
        required
        inputProps={{ min: 0, step: 0.01 }}
      />

      <Autocomplete
        options={transactionTypeOptions}
        getOptionLabel={(option) => option.name}
        groupBy={(option) => option.categoryName}
        value={selectedTransactionType || null}
        onChange={(_event, newValue) => {
          const newId = newValue?.id || '';
          setFormData({ ...formData, transactionTypeId: newId });
          if (errors.transactionTypeId) {
            setErrors({ ...errors, transactionTypeId: '' });
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
          onChange={handleChange('fromAccountId')}
          error={!!errors.fromAccountId}
          helperText={errors.fromAccountId}
          required
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
          onChange={handleChange('fromAssetId')}
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
          {manualAssets.map((asset) => (
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
          onChange={handleChange('toAccountId')}
          error={!!errors.toAccountId}
          helperText={errors.toAccountId}
          required
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
          onChange={handleChange('toAssetId')}
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
          {manualAssets.map((asset) => (
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
