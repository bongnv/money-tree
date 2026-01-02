import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, MenuItem, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Clear as ClearIcon, MoreHoriz as MoreIcon } from '@mui/icons-material';
import type { Transaction, Account, TransactionType, Category } from '../../types/models';
import { Group } from '../../types/enums';
import { toDateString, getTodayDate } from '../../utils/date.utils';
import { validationService, ValidationError } from '../../services/validation.service';

interface QuickEntryRowProps {
  accounts: Account[];
  categories: Category[];
  transactionTypes: TransactionType[];
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onOpenFullDialog: () => void;
}

export const QuickEntryRow: React.FC<QuickEntryRowProps> = ({
  accounts,
  categories,
  transactionTypes,
  onSubmit,
  onOpenFullDialog,
}) => {
  // Get stored defaults from localStorage
  const getStoredDefaults = () => {
    const stored = localStorage.getItem('quickEntryDefaults');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  };

  const storedDefaults = getStoredDefaults();

  const [formData, setFormData] = useState({
    date: getTodayDate(),
    amount: '',
    transactionTypeId: storedDefaults.transactionTypeId || '',
    fromAccountId: storedDefaults.fromAccountId || '',
    toAccountId: storedDefaults.toAccountId || '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validate()) {
      return;
    }

    // Store defaults in localStorage
    localStorage.setItem(
      'quickEntryDefaults',
      JSON.stringify({
        transactionTypeId: formData.transactionTypeId,
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
      })
    );

    onSubmit({
      date: formData.date,
      description: formData.description.trim() || undefined,
      amount: parseFloat(formData.amount),
      transactionTypeId: formData.transactionTypeId,
      fromAccountId: formData.fromAccountId || undefined,
      toAccountId: formData.toAccountId || undefined,
    });

    // Clear form and focus on amount field
    setFormData({
      date: getTodayDate(),
      amount: '',
      transactionTypeId: formData.transactionTypeId, // Keep last used type
      fromAccountId: formData.fromAccountId, // Keep last used account
      toAccountId: formData.toAccountId, // Keep last used account
      description: '',
    });
    setErrors({});

    // Focus on amount field for next entry
    setTimeout(() => {
      amountRef.current?.focus();
    }, 0);
  };

  const handleClear = () => {
    setFormData({
      date: getTodayDate(),
      amount: '',
      transactionTypeId: '',
      fromAccountId: '',
      toAccountId: '',
      description: '',
    });
    setErrors({});
    amountRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
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

  const showFromAccount = selectedGroup === Group.EXPENSE || selectedGroup === Group.TRANSFER;
  const showToAccount =
    selectedGroup === Group.INCOME ||
    selectedGroup === Group.TRANSFER ||
    selectedGroup === Group.INVESTMENT;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      sx={{
        display: 'flex',
        gap: 1,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        mb: 2,
        alignItems: 'flex-start',
      }}
    >
      <TextField
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
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{ width: 150 }}
      />

      <TextField
        inputRef={amountRef}
        placeholder="Amount"
        type="number"
        value={formData.amount}
        onChange={handleChange('amount')}
        error={!!errors.amount}
        helperText={errors.amount}
        size="small"
        inputProps={{ min: 0, step: 0.01 }}
        sx={{ width: 120 }}
      />

      <TextField
        select
        placeholder="Type"
        value={formData.transactionTypeId}
        onChange={handleChange('transactionTypeId')}
        error={!!errors.transactionTypeId}
        helperText={errors.transactionTypeId}
        size="small"
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">
          <em>Select type...</em>
        </MenuItem>
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
      </TextField>

      {showFromAccount && (
        <TextField
          select
          placeholder="From"
          value={formData.fromAccountId}
          onChange={handleChange('fromAccountId')}
          error={!!errors.fromAccountId}
          helperText={errors.fromAccountId}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">
            <em>From account...</em>
          </MenuItem>
          {activeAccounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.name}
            </MenuItem>
          ))}
        </TextField>
      )}

      {showToAccount && (
        <TextField
          select
          placeholder="To"
          value={formData.toAccountId}
          onChange={handleChange('toAccountId')}
          error={!!errors.toAccountId}
          helperText={errors.toAccountId}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">
            <em>To account...</em>
          </MenuItem>
          {activeAccounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.name}
            </MenuItem>
          ))}
        </TextField>
      )}

      <TextField
        placeholder="Description (optional)"
        value={formData.description}
        onChange={handleChange('description')}
        error={!!errors.description}
        helperText={errors.description}
        size="small"
        sx={{ flexGrow: 1, minWidth: 150 }}
      />

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Add transaction (Enter)">
          <IconButton
            type="submit"
            color="primary"
            size="small"
            disabled={!formData.amount || !formData.transactionTypeId}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear form (Esc)">
          <IconButton onClick={handleClear} size="small">
            <ClearIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Open full dialog for complex transactions">
          <IconButton onClick={onOpenFullDialog} size="small">
            <MoreIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
