import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Tooltip, Autocomplete } from '@mui/material';
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
  const dateRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const fromAccountRef = useRef<HTMLInputElement>(null);
  const toAccountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

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
    // Check if the focused element is a combobox with an open dropdown
    const target = e.target as HTMLElement;
    const isCombobox = target.getAttribute('role') === 'combobox';
    const isDropdownOpen = target.getAttribute('aria-expanded') === 'true';

    if (e.key === 'Enter' && !e.shiftKey) {
      // Don't submit if dropdown is open - let Autocomplete handle it
      if (isCombobox && isDropdownOpen) {
        return;
      }
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Handle left/right arrow key navigation
      handleArrowNavigation(e);
    }
  };

  const handleArrowNavigation = (e: React.KeyboardEvent) => {
    const fieldRefs = [dateRef, amountRef, typeRef];

    if (showFromAccount) fieldRefs.push(fromAccountRef);
    if (showToAccount) fieldRefs.push(toAccountRef);
    fieldRefs.push(descriptionRef);

    // Find which field is currently focused by checking which ref contains the active element
    const currentIndex = fieldRefs.findIndex((ref) => {
      const element = ref.current;
      if (!element) return false;
      // Check if this element is focused or contains the focused element
      return (
        element === document.activeElement ||
        (element.contains && element.contains(document.activeElement))
      );
    });

    if (currentIndex === -1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % fieldRefs.length;
      const nextElement = fieldRefs[nextIndex].current;
      // For Autocomplete, focus the input inside
      if (nextElement) {
        const input = nextElement.querySelector('input');
        if (input) {
          input.focus();
        } else {
          nextElement.focus();
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + fieldRefs.length) % fieldRefs.length;
      const prevElement = fieldRefs[prevIndex].current;
      // For Autocomplete, focus the input inside
      if (prevElement) {
        const input = prevElement.querySelector('input');
        if (input) {
          input.focus();
        } else {
          prevElement.focus();
        }
      }
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
        inputRef={dateRef}
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

      <Autocomplete
        ref={typeRef}
        options={transactionTypes}
        value={transactionTypes.find((tt) => tt.id === formData.transactionTypeId) || null}
        onChange={(_, newValue) => {
          setFormData({
            ...formData,
            transactionTypeId: newValue?.id || '',
          });
          if (errors.transactionTypeId) {
            setErrors({ ...errors, transactionTypeId: '' });
          }
        }}
        getOptionLabel={(option) => option.name}
        groupBy={(option) => {
          const category = categories.find((c) => c.id === option.categoryId);
          return category?.name || '';
        }}
        disableClearable={false}
        openOnFocus
        size="small"
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Type"
            error={!!errors.transactionTypeId}
            helperText={errors.transactionTypeId}
          />
        )}
        sx={{ minWidth: 180 }}
      />

      {showFromAccount && (
        <Autocomplete
          ref={fromAccountRef}
          options={activeAccounts}
          value={activeAccounts.find((a) => a.id === formData.fromAccountId) || null}
          onChange={(_, newValue) => {
            setFormData({
              ...formData,
              fromAccountId: newValue?.id || '',
            });
            if (errors.fromAccountId) {
              setErrors({ ...errors, fromAccountId: '' });
            }
          }}
          getOptionLabel={(option) => option.name}
          disableClearable={false}
          openOnFocus
          size="small"
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="From"
              error={!!errors.fromAccountId}
              helperText={errors.fromAccountId}
            />
          )}
          sx={{ minWidth: 150 }}
        />
      )}

      {showToAccount && (
        <Autocomplete
          ref={toAccountRef}
          options={activeAccounts}
          value={activeAccounts.find((a) => a.id === formData.toAccountId) || null}
          onChange={(_, newValue) => {
            setFormData({
              ...formData,
              toAccountId: newValue?.id || '',
            });
            if (errors.toAccountId) {
              setErrors({ ...errors, toAccountId: '' });
            }
          }}
          getOptionLabel={(option) => option.name}
          disableClearable={false}
          openOnFocus
          size="small"
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="To"
              error={!!errors.toAccountId}
              helperText={errors.toAccountId}
            />
          )}
          sx={{ minWidth: 150 }}
        />
      )}

      <TextField
        inputRef={descriptionRef}
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
