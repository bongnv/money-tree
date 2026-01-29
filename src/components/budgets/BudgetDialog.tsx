import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  Box,
  Button,
  Autocomplete,
} from '@mui/material';
import { FormDatePicker } from '../common/FormDatePicker';
import type { Budget } from '../../types/models';
import { useCategories, useTransactionTypes } from '../../hooks/queries';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';
import { CurrencyCode, Group } from '../../types/enums';

interface BudgetDialogProps {
  open: boolean;
  budget?: Budget;
  onClose: () => void;
  onSubmit: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
}

export const BudgetDialog: React.FC<BudgetDialogProps> = ({ open, budget, onClose, onSubmit }) => {
  const categories = useCategories();
  const transactionTypes = useTransactionTypes();

  const [formData, setFormData] = useState({
    transactionTypeId: budget?.transactionTypeId || '',
    amount: budget?.amount?.toString() || '',
    currencyCode: budget?.currencyCode || 'usd',
    period: budget?.period || ('monthly' as 'monthly' | 'quarterly' | 'yearly'),
    startDate: budget?.startDate || new Date().getFullYear() + '-01-01',
    endDate: budget?.endDate || new Date().getFullYear() + '-12-31',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Flatten transaction types with category labels for autocomplete - only show income and expense types
  const transactionTypeOptions = useMemo(() => {
    if (!categories || !transactionTypes) return [];
    const options: Array<{ id: string; name: string; categoryName: string }> = [];
    categories.forEach((category) => {
      const types = transactionTypes.filter(
        (tt) =>
          tt.categoryId === category.id &&
          tt.isActive !== false &&
          (tt.group === Group.INCOME || tt.group === Group.EXPENSE)
      );
      types.forEach((type) => {
        options.push({
          id: type.id,
          name: type.name,
          categoryName: category.name,
        });
      });
    });
    return options;
  }, [categories, transactionTypes]);

  const selectedTransactionTypeOption = transactionTypeOptions.find(
    (opt) => opt.id === formData.transactionTypeId
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.transactionTypeId) {
      newErrors.transactionTypeId = 'Transaction type is required';
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.period) {
      newErrors.period = 'Period is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be on or after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      transactionTypeId: formData.transactionTypeId,
      amount: parseFloat(formData.amount),
      currencyCode: formData.currencyCode as CurrencyCode,
      period: formData.period,
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
    onClose();
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{budget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ pt: 1 }}>
          <Autocomplete
            options={transactionTypeOptions}
            getOptionLabel={(option) => option.name}
            groupBy={(option) => option.categoryName}
            value={selectedTransactionTypeOption || null}
            onChange={(_event, newValue) => {
              setFormData({ ...formData, transactionTypeId: newValue?.id || '' });
              if (errors.transactionTypeId) {
                setErrors({ ...errors, transactionTypeId: '' });
              }
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={!!budget}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Transaction Type"
                error={!!errors.transactionTypeId}
                helperText={errors.transactionTypeId}
                required
                margin="normal"
              />
            )}
          />

          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={handleChange('amount')}
            error={!!errors.amount}
            helperText={errors.amount}
            margin="normal"
            required
            inputProps={{ min: 0, step: 0.01 }}
          />

          <TextField
            fullWidth
            select
            label="Currency"
            value={formData.currencyCode}
            onChange={handleChange('currencyCode')}
            margin="normal"
            required
          >
            {DEFAULT_CURRENCIES.map((currency) => (
              <MenuItem key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Period"
            value={formData.period}
            onChange={handleChange('period')}
            error={!!errors.period}
            helperText={errors.period}
            margin="normal"
            required
          >
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="quarterly">Quarterly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </TextField>

          <FormDatePicker
            label="Start Date"
            value={formData.startDate}
            onChange={(date) => setFormData({ ...formData, startDate: date })}
            error={!!errors.startDate}
            helperText={errors.startDate}
          />

          <FormDatePicker
            label="End Date"
            value={formData.endDate}
            onChange={(date) => setFormData({ ...formData, endDate: date })}
            error={!!errors.endDate}
            helperText={errors.endDate}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {budget ? 'Update' : 'Add'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
