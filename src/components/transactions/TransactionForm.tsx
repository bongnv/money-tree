import React, { useState, useEffect } from 'react';
import { Box, Button, MenuItem } from '@mui/material';
import { FormTextField } from '../common/FormTextField';
import type { Transaction, Account, TransactionType, Category } from '../../types/models';
import { Group } from '../../types/enums';
import { formatDateForInput, toISODate, getTodayISO } from '../../utils/date.utils';
import { validationService, ValidationError } from '../../services/validation.service';

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
    date: transaction?.date || getTodayISO(),
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    transactionTypeId: transaction?.transactionTypeId || '',
    fromAccountId: transaction?.fromAccountId || '',
    toAccountId: transaction?.toAccountId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Update selected group when transaction type changes
  useEffect(() => {
    if (formData.transactionTypeId) {
      const transactionType = transactionTypes.find((tt) => tt.id === formData.transactionTypeId);
      if (transactionType) {
        const category = categories.find((c) => c.id === transactionType.categoryId);
        if (category) {
          setSelectedGroup(category.group);
        }
      }
    } else {
      setSelectedGroup(null);
    }
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

    const partialTransaction: Partial<Transaction> = {
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      transactionTypeId: formData.transactionTypeId || undefined,
      fromAccountId: formData.fromAccountId || undefined,
      toAccountId: formData.toAccountId || undefined,
    };

    const validationErrors = validationService.validateTransaction(
      partialTransaction,
      transactionType,
      category,
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
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      transactionTypeId: formData.transactionTypeId,
      fromAccountId: formData.fromAccountId || undefined,
      toAccountId: formData.toAccountId || undefined,
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

  // Group transaction types by category
  const groupedTransactionTypes = categories.map((category) => ({
    category,
    types: transactionTypes.filter((tt) => tt.categoryId === category.id),
  }));

  const activeAccounts = accounts.filter((a) => a.isActive);

  const showFromAccount = selectedGroup === Group.EXPENSE || selectedGroup === Group.TRANSFER;
  const showToAccount =
    selectedGroup === Group.INCOME ||
    selectedGroup === Group.TRANSFER ||
    selectedGroup === Group.INVESTMENT;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <FormTextField
        label="Date"
        type="date"
        value={formatDateForInput(formData.date)}
        onChange={(e) => {
          const isoDate = toISODate(e.target.value);
          setFormData({ ...formData, date: isoDate });
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
        required
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
        {groupedTransactionTypes.map(({ category, types }) => [
          <MenuItem key={`group-${category.id}`} disabled>
            <strong>{category.name}</strong>
          </MenuItem>,
          ...types.map((type) => (
            <MenuItem key={type.id} value={type.id} sx={{ pl: 4 }}>
              {type.name}
            </MenuItem>
          )),
        ])}
      </FormTextField>

      {showFromAccount && (
        <FormTextField
          select
          label="From Account"
          value={formData.fromAccountId}
          onChange={handleChange('fromAccountId')}
          error={!!errors.fromAccountId}
          helperText={errors.fromAccountId}
          required={showFromAccount}
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

      {showToAccount && (
        <FormTextField
          select
          label="To Account"
          value={formData.toAccountId}
          onChange={handleChange('toAccountId')}
          error={!!errors.toAccountId}
          helperText={errors.toAccountId}
          required={showToAccount}
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

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          {transaction ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};
