import React, { useRef } from 'react';
import { Box, TextField, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Clear as ClearIcon, MoreHoriz as MoreIcon } from '@mui/icons-material';
import { QuickEntryAutocomplete } from './QuickEntryAutocomplete';
import { FormDatePicker } from '@/components/common/FormDatePicker';
import type {
  Transaction,
  Account,
  TransactionType,
  Category,
  ManualAsset,
} from '@/types/models';
import { Group } from '@/types/enums';
import { useQuickEntryForm } from '@/hooks/transactions/useQuickEntryForm';

interface QuickEntryRowProps {
  accounts: Account[];
  categories: Category[];
  transactionTypes: TransactionType[];
  manualAssets: ManualAsset[];
  transactions: Transaction[];
  onSubmit: (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => void;
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
  const {
    formData,
    errors,
    hasFromAccountDefault,
    hasToAccountDefault,
    showFromAccount,
    showToAccount,
    showFromAsset,
    showToAsset,
    handleSubmit,
    handleClear,
    handleChange,
    updateFormData,
    clearError,
  } = useQuickEntryForm({ accounts, transactionTypes, transactions, onSubmit });

  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const fromAccountRef = useRef<HTMLInputElement>(null);
  const toAccountRef = useRef<HTMLInputElement>(null);
  const fromAssetRef = useRef<HTMLInputElement>(null);
  const toAssetRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  const handleSubmitWrapper = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    handleSubmit();
    // Focus on amount field for next entry
    setTimeout(() => {
      amountRef.current?.focus();
    }, 0);
  };

  const handleClearWrapper = () => {
    handleClear();
    amountRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitWrapper();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClearWrapper();
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

  const handleFieldChange =
    <K extends keyof typeof formData>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      handleChange(field)(e.target.value);
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
          handleSubmitWrapper();
        }, 0);
      }
    }
  };

  const activeAccounts = accounts.filter((a) => a.isActive);

  return (
    <Box
      component="form"
      onSubmit={handleSubmitWrapper}
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
      <FormDatePicker
        label=""
        value={formData.date}
        onChange={(date) => {
          updateFormData({ date });
          clearError('date');
        }}
        error={!!errors.date}
        helperText={errors.date}
        size="small"
        fullWidth={false}
        sx={{ width: 150 }}
      />

      <TextField
        inputRef={amountRef}
        placeholder="Amount"
        type="number"
        value={formData.amount}
        onChange={handleFieldChange('amount')}
        error={!!errors.amount}
        helperText={errors.amount}
        size="small"
        inputProps={{ step: 0.01 }}
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

          const updates: Record<string, string> = {
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

          updateFormData(updates);
          clearError('transactionTypeId');

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

      {showFromAccount && (
        <QuickEntryAutocomplete
          inputRef={fromAccountRef}
          options={activeAccounts}
          value={activeAccounts.find((a) => a.id === formData.fromAccountId) || null}
          onChange={(newValue) => {
            updateFormData({ fromAccountId: newValue?.id || '' });
            clearError('fromAccountId');

            // Focus next field if value was selected
            if (newValue) {
              focusNextField(fromAccountRef);
            }
          }}
          getOptionLabel={(option) => option.name}
          placeholder="From"
          error={!!errors.fromAccountId}
          helperText={errors.fromAccountId}
          disabled={hasFromAccountDefault}
        />
      )}

      {showToAccount && (
        <QuickEntryAutocomplete
          inputRef={toAccountRef}
          options={activeAccounts}
          value={activeAccounts.find((a) => a.id === formData.toAccountId) || null}
          onChange={(newValue) => {
            updateFormData({ toAccountId: newValue?.id || '' });
            clearError('toAccountId');

            // Focus next field if value was selected
            if (newValue) {
              focusNextField(toAccountRef);
            }
          }}
          getOptionLabel={(option) => option.name}
          placeholder="To"
          error={!!errors.toAccountId}
          helperText={errors.toAccountId}
          disabled={hasToAccountDefault}
        />
      )}

      {showFromAsset && (
        <QuickEntryAutocomplete
          inputRef={fromAssetRef}
          options={manualAssets}
          value={manualAssets.find((a) => a.id === formData.fromAssetId) || null}
          onChange={(newValue) => {
            updateFormData({ fromAssetId: newValue?.id || '' });
            clearError('fromAssetId');

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
            updateFormData({ toAssetId: newValue?.id || '' });
            clearError('toAssetId');

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
        onChange={handleFieldChange('description')}
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
          <IconButton onClick={handleClearWrapper} size="small" aria-label="Clear form (Esc)">
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
