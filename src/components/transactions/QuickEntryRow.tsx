import React, { useState, useRef, useMemo } from 'react';
import { Box, TextField, IconButton, Tooltip, Chip } from '@mui/material';
import { Add as AddIcon, Clear as ClearIcon, MoreHoriz as MoreIcon } from '@mui/icons-material';
import { QuickEntryAutocomplete } from './QuickEntryAutocomplete';
import type {
  Transaction,
  Account,
  TransactionType,
  Category,
  ManualAsset,
} from '../../types/models';
import { Group } from '../../types/enums';
import { getTodayDate } from '../../utils/date.utils';
import { validationService, ValidationError } from '../../services/validation.service';

interface QuickEntryRowProps {
  accounts: Account[];
  categories: Category[];
  transactionTypes: TransactionType[];
  manualAssets: ManualAsset[];
  transactions: Transaction[];
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onOpenFullDialog: () => void;
}

export const QuickEntryRow: React.FC<QuickEntryRowProps> = ({
  accounts,
  categories,
  transactionTypes,
  manualAssets,
  transactions,
  onSubmit,
  onOpenFullDialog,
}) => {
  // Get default date: latest transaction date or today
  const getDefaultDate = () => {
    if (transactions.length === 0) {
      return getTodayDate();
    }
    const latestTransaction = transactions.reduce((latest, current) => {
      return current.date > latest.date ? current : latest;
    });
    return latestTransaction.date;
  };

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
    date: getDefaultDate(),
    amount: '',
    transactionTypeId: storedDefaults.transactionTypeId || '',
    fromAccountId: storedDefaults.fromAccountId || '',
    toAccountId: storedDefaults.toAccountId || '',
    fromAssetId: '',
    toAssetId: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const fromAccountRef = useRef<HTMLInputElement>(null);
  const toAccountRef = useRef<HTMLInputElement>(null);
  const fromAssetRef = useRef<HTMLInputElement>(null);
  const toAssetRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

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

  // Get selected transaction type with defaults
  const selectedTransactionType = useMemo(() => {
    return transactionTypes.find((tt) => tt.id === formData.transactionTypeId);
  }, [formData.transactionTypeId, transactionTypes]);

  // Check if accounts have defaults (should be hidden in quick entry)
  const hasFromAccountDefault = !!selectedTransactionType?.defaultFromAccountId;
  const hasToAccountDefault = !!selectedTransactionType?.defaultToAccountId;

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
      fromAssetId: formData.fromAssetId || undefined,
      toAssetId: formData.toAssetId || undefined,
    });

    // Clear amount and description fields for next entry
    setFormData({
      ...formData,
      amount: '',
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
      date: getDefaultDate(),
      amount: '',
      transactionTypeId: '',
      fromAccountId: '',
      toAccountId: '',
      fromAssetId: '',
      toAssetId: '',
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
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      handleArrowNavigation(e);
    }
  };

  const handleArrowNavigation = (e: React.KeyboardEvent) => {
    const fieldRefs = [dateRef, amountRef, typeRef];

    if (showFromAccount) fieldRefs.push(fromAccountRef);
    if (showToAccount) fieldRefs.push(toAccountRef);
    if (showFromAsset) fieldRefs.push(fromAssetRef);
    if (showToAsset) fieldRefs.push(toAssetRef);
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

  const focusNextField = (currentRef: React.RefObject<HTMLInputElement | null>) => {
    const fieldRefs = [dateRef, amountRef, typeRef];

    if (showFromAccount) fieldRefs.push(fromAccountRef);
    if (showToAccount) fieldRefs.push(toAccountRef);
    if (showFromAsset) fieldRefs.push(fromAssetRef);
    if (showToAsset) fieldRefs.push(toAssetRef);
    fieldRefs.push(descriptionRef);

    const currentIndex = fieldRefs.indexOf(currentRef);
    if (currentIndex !== -1) {
      if (currentIndex < fieldRefs.length - 1) {
        // Not the last field, focus next
        setTimeout(() => {
          const nextElement = fieldRefs[currentIndex + 1].current;
          if (nextElement) {
            const input = nextElement.querySelector('input');
            if (input) {
              input.focus();
            } else {
              nextElement.focus();
            }
          }
        }, 0);
      } else {
        // Last field, submit the form
        setTimeout(() => {
          handleSubmit();
        }, 0);
      }
    }
  };

  const activeAccounts = accounts.filter((a) => a.isActive);

  const showFromAccount =
    (selectedGroup === Group.EXPENSE ||
      selectedGroup === Group.TRANSFER ||
      selectedGroup === Group.ASSET_PURCHASE) &&
    !hasFromAccountDefault; // Hide if default is set

  const showToAccount =
    (selectedGroup === Group.INCOME ||
      selectedGroup === Group.TRANSFER ||
      selectedGroup === Group.ASSET_SALE) &&
    !hasToAccountDefault; // Hide if default is set

  const showFromAsset = selectedGroup === Group.ASSET_SALE;
  const showToAsset = selectedGroup === Group.ASSET_PURCHASE;

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
          const value = e.target.value;
          // Only update if value is not empty or is valid date format
          // This prevents clearing the date when user types incomplete input
          if (value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            setFormData({ ...formData, date: value });
          }
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

      <QuickEntryAutocomplete
        inputRef={typeRef}
        options={transactionTypes}
        value={transactionTypes.find((tt) => tt.id === formData.transactionTypeId) || null}
        onChange={(newValue) => {
          const newTypeId = newValue?.id || '';
          const newTransactionType = transactionTypes.find((tt) => tt.id === newTypeId);
          const newGroup = newTransactionType?.group;

          const updates: Partial<typeof formData> = {
            transactionTypeId: newTypeId,
            fromAssetId: '',
            toAssetId: '',
          };

          if (
            newGroup === Group.EXPENSE ||
            newGroup === Group.TRANSFER ||
            newGroup === Group.ASSET_PURCHASE
          ) {
            if (newTransactionType?.defaultFromAccountId) {
              updates.fromAccountId = newTransactionType.defaultFromAccountId;
            }
          } else {
            updates.fromAccountId = '';
          }

          if (
            newGroup === Group.INCOME ||
            newGroup === Group.TRANSFER ||
            newGroup === Group.ASSET_SALE
          ) {
            if (newTransactionType?.defaultToAccountId) {
              updates.toAccountId = newTransactionType.defaultToAccountId;
            }
          } else {
            updates.toAccountId = '';
          }

          setFormData({
            ...formData,
            ...updates,
          });
          if (errors.transactionTypeId) {
            setErrors({ ...errors, transactionTypeId: '' });
          }

          // Focus next field if value was selected
          if (newValue) {
            focusNextField(typeRef);
          }
        }}
        getOptionLabel={(option) => option.name}
        groupBy={(option) => {
          const category = categories.find((c) => c.id === option.categoryId);
          return category?.name || '';
        }}
        placeholder="Type"
        error={!!errors.transactionTypeId}
        helperText={errors.transactionTypeId}
        minWidth={180}
      />

      {(hasFromAccountDefault || hasToAccountDefault) && (
        <Chip
          label={
            hasFromAccountDefault && hasToAccountDefault
              ? `From: ${accounts.find((a) => a.id === selectedTransactionType?.defaultFromAccountId)?.name} → To: ${accounts.find((a) => a.id === selectedTransactionType?.defaultToAccountId)?.name}`
              : hasFromAccountDefault
                ? `From: ${accounts.find((a) => a.id === selectedTransactionType?.defaultFromAccountId)?.name}`
                : `To: ${accounts.find((a) => a.id === selectedTransactionType?.defaultToAccountId)?.name}`
          }
          size="small"
          sx={{ alignSelf: 'center' }}
        />
      )}

      {showFromAccount && (
        <QuickEntryAutocomplete
          inputRef={fromAccountRef}
          options={activeAccounts}
          value={activeAccounts.find((a) => a.id === formData.fromAccountId) || null}
          onChange={(newValue) => {
            setFormData({
              ...formData,
              fromAccountId: newValue?.id || '',
            });
            if (errors.fromAccountId) {
              setErrors({ ...errors, fromAccountId: '' });
            }

            // Focus next field if value was selected
            if (newValue) {
              focusNextField(fromAccountRef);
            }
          }}
          getOptionLabel={(option) => option.name}
          placeholder="From"
          error={!!errors.fromAccountId}
          helperText={errors.fromAccountId}
        />
      )}

      {showToAccount && (
        <QuickEntryAutocomplete
          inputRef={toAccountRef}
          options={activeAccounts}
          value={activeAccounts.find((a) => a.id === formData.toAccountId) || null}
          onChange={(newValue) => {
            setFormData({
              ...formData,
              toAccountId: newValue?.id || '',
            });
            if (errors.toAccountId) {
              setErrors({ ...errors, toAccountId: '' });
            }

            // Focus next field if value was selected
            if (newValue) {
              focusNextField(toAccountRef);
            }
          }}
          getOptionLabel={(option) => option.name}
          placeholder="To"
          error={!!errors.toAccountId}
          helperText={errors.toAccountId}
        />
      )}

      {showFromAsset && (
        <QuickEntryAutocomplete
          inputRef={fromAssetRef}
          options={manualAssets}
          value={manualAssets.find((a) => a.id === formData.fromAssetId) || null}
          onChange={(newValue) => {
            setFormData({
              ...formData,
              fromAssetId: newValue?.id || '',
            });
            if (errors.fromAssetId) {
              setErrors({ ...errors, fromAssetId: '' });
            }

            // Focus next field if value was selected
            if (newValue) {
              focusNextField(fromAssetRef);
            }
          }}
          getOptionLabel={(option) => option.name}
          placeholder="From Asset"
          error={!!errors.fromAssetId}
          helperText={errors.fromAssetId}
        />
      )}

      {showToAsset && (
        <QuickEntryAutocomplete
          inputRef={toAssetRef}
          options={manualAssets}
          value={manualAssets.find((a) => a.id === formData.toAssetId) || null}
          onChange={(newValue) => {
            setFormData({
              ...formData,
              toAssetId: newValue?.id || '',
            });
            if (errors.toAssetId) {
              setErrors({ ...errors, toAssetId: '' });
            }

            // Focus next field if value was selected
            if (newValue) {
              focusNextField(toAssetRef);
            }
          }}
          getOptionLabel={(option) => option.name}
          placeholder="To Asset"
          error={!!errors.toAssetId}
          helperText={errors.toAssetId}
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
          <span>
            <IconButton
              type="submit"
              color="primary"
              size="small"
              disabled={!formData.amount || !formData.transactionTypeId}
              aria-label="Add transaction (Enter)"
            >
              <AddIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Clear form (Esc)">
          <IconButton onClick={handleClear} size="small" aria-label="Clear form (Esc)">
            <ClearIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Open full dialog for complex transactions">
          <IconButton
            onClick={onOpenFullDialog}
            size="small"
            aria-label="Open full dialog for complex transactions"
          >
            <MoreIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
