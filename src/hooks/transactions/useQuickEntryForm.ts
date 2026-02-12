import { useState, useMemo, useCallback } from 'react';
import { validationService, ValidationError } from '@/services/validation.service';
import { Group } from '@/types/enums';
import type { Transaction, Account, TransactionType } from '@/types/models';
import { getTodayDate } from '@/utils/date.utils';

interface QuickEntryFormData {
  date: string;
  amount: string;
  transactionTypeId: string;
  fromAccountId: string;
  toAccountId: string;
  fromAssetId: string;
  toAssetId: string;
  description: string;
}

interface UseQuickEntryFormParams {
  accounts: Account[];
  transactionTypes: TransactionType[];
  transactions: Transaction[];
  onSubmit: (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => void;
}

export function useQuickEntryForm({
  accounts,
  transactionTypes,
  transactions,
  onSubmit,
}: UseQuickEntryFormParams) {
  // Get default date: latest transaction date or today
  const getDefaultDate = useCallback(() => {
    if (transactions.length === 0) {
      return getTodayDate();
    }
    const latestTransaction = transactions.reduce((latest, current) => {
      return current.date > latest.date ? current : latest;
    });
    return latestTransaction.date;
  }, [transactions]);

  // Get stored defaults from localStorage
  const getStoredDefaults = useCallback(() => {
    const stored = localStorage.getItem('quickEntryDefaults');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  }, []);

  const storedDefaults = getStoredDefaults();

  const [formData, setFormData] = useState<QuickEntryFormData>({
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

  // Check if accounts have defaults (will be shown as disabled)
  const hasFromAccountDefault = !!selectedTransactionType?.defaultFromAccountId;
  const hasToAccountDefault = !!selectedTransactionType?.defaultToAccountId;

  // Field visibility logic - always show if group requires them
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

  const validate = useCallback((): boolean => {
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
  }, [formData, transactionTypes, accounts]);

  const handleSubmit = useCallback(() => {
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
  }, [formData, validate, onSubmit]);

  const handleClear = useCallback(() => {
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
  }, [getDefaultDate]);

  const handleChange = useCallback(
    (field: keyof QuickEntryFormData) => (value: string) => {
      setFormData({
        ...formData,
        [field]: value,
      });
      if (errors[field]) {
        setErrors({ ...errors, [field]: '' });
      }
    },
    [formData, errors]
  );

  const updateFormData = useCallback((updates: Partial<QuickEntryFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  return {
    formData,
    errors,
    selectedGroup,
    selectedTransactionType,
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
  };
}
