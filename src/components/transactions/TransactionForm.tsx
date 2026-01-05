import React, { useState, useMemo } from 'react';
import { Box, Button, MenuItem, Alert } from '@mui/material';
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
        const category = categories.find((c) => c.id === transactionType.categoryId);
        if (category) {
          return category.group;
        }
      }
    }
    return null;
  }, [formData.transactionTypeId, transactionTypes, categories]);

  const validate = (): boolean => {
    const transactionType = transactionTypes.find((tt) => tt.id === formData.transactionTypeId);
    const category = transactionType
      ? categories.find((c) => c.id === transactionType.categoryId)
      : undefined;
    const fromAccount = formData.fromAccountId
      ? accounts.find((a) => a.id === formData.fromAccountId)
      : undefined;
    const toAccount = formData.toAccountId
      ? accounts.find((a) => a.id === formData.toAccountId)
      : undefined;
    const fromAsset = formData.fromAssetId
      ? manualAssets.find((a) => a.id === formData.fromAssetId)
      : undefined;
    const toAsset = formData.toAssetId
      ? manualAssets.find((a) => a.id === formData.toAssetId)
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
      category,
      fromAccount,
      toAccount,
      fromAsset,
      toAsset
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
  const groupedTransactionTypes = categories.map((category) => ({
    category,
    types: transactionTypes.filter((tt) => tt.categoryId === category.id),
  }));

  const activeAccounts = accounts.filter((a) => a.isActive);

  // Determine which fields to show based on selected group
  const showFromAccount =
    selectedGroup === Group.EXPENSE ||
    selectedGroup === Group.TRANSFER ||
    (selectedGroup === Group.ASSET_TRANSACTION && !formData.fromAssetId);
  const showToAccount =
    selectedGroup === Group.INCOME ||
    selectedGroup === Group.TRANSFER ||
    (selectedGroup === Group.ASSET_TRANSACTION && !formData.toAssetId);
  const showFromAsset = selectedGroup === Group.ASSET_TRANSACTION;
  const showToAsset = selectedGroup === Group.ASSET_TRANSACTION;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {selectedGroup === Group.ASSET_TRANSACTION && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Asset Transaction:</strong> The asset value will be automatically updated when you
          save this transaction. Use "From Asset" for liquidation (selling/withdrawing) or "To
          Asset" for purchase (buying/depositing).
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

      <FormTextField
        select
        label="Transaction Type"
        value={formData.transactionTypeId}
        onChange={handleChange('transactionTypeId')}
        error={!!errors.transactionTypeId}
        helperText={errors.transactionTypeId}
        required
      >
        {groupedTransactionTypes.flatMap(({ category, types }) =>
          types.length > 0
            ? [
                <MenuItem key={`header-${category.id}`} disabled>
                  <strong>{category.name}</strong>
                </MenuItem>,
                ...types.map((type) => (
                  <MenuItem key={type.id} value={type.id} sx={{ pl: 4 }}>
                    {type.name}
                  </MenuItem>
                )),
              ]
            : []
        )}
      </FormTextField>

      {showFromAccount && (
        <FormTextField
          select
          label="From Account"
          value={formData.fromAccountId}
          onChange={handleChange('fromAccountId')}
          error={!!errors.fromAccountId}
          helperText={errors.fromAccountId}
          required={showFromAccount && !formData.fromAssetId}
          disabled={!!formData.fromAssetId}
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
          onChange={(e) => {
            const value = e.target.value;
            setFormData({
              ...formData,
              fromAssetId: value,
              toAssetId: '', // Clear opposite direction
              fromAccountId: '', // Clear opposite account
            });
            if (errors.fromAssetId) {
              setErrors({ ...errors, fromAssetId: '' });
            }
          }}
          error={!!errors.fromAssetId}
          helperText={
            errors.fromAssetId ||
            'Liquidation: Sell or withdraw from asset. Asset value will decrease by transaction amount.'
          }
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
          required={showToAccount && !formData.toAssetId}
          disabled={!!formData.toAssetId}
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
          onChange={(e) => {
            const value = e.target.value;
            setFormData({
              ...formData,
              toAssetId: value,
              fromAssetId: '', // Clear opposite direction
              toAccountId: '', // Clear opposite account
            });
            if (errors.toAssetId) {
              setErrors({ ...errors, toAssetId: '' });
            }
          }}
          error={!!errors.toAssetId}
          helperText={
            errors.toAssetId ||
            'Purchase: Buy or deposit into asset. Asset value will increase by transaction amount.'
          }
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
