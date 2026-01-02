import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  Box,
  Button,
} from '@mui/material';
import type { Budget } from '../../types/models';
import { useCategoryStore } from '../../stores/useCategoryStore';

interface BudgetDialogProps {
  open: boolean;
  budget?: Budget;
  onClose: () => void;
  onSubmit: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const BudgetDialog: React.FC<BudgetDialogProps> = ({
  open,
  budget,
  onClose,
  onSubmit,
}) => {
  const { categories, transactionTypes } = useCategoryStore();

  const [formData, setFormData] = useState({
    transactionTypeId: budget?.transactionTypeId || '',
    amount: budget?.amount?.toString() || '',
    period: budget?.period || 'monthly' as 'monthly' | 'quarterly' | 'yearly',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Group transaction types by category
  const groupedTransactionTypes = categories.map((category) => ({
    category,
    transactionTypes: transactionTypes.filter((tt) => tt.categoryId === category.id),
  })).filter((group) => group.transactionTypes.length > 0);

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
      period: formData.period,
    });
    onClose();
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {budget ? 'Edit Budget' : 'Add Budget'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ pt: 1 }}>
          <TextField
            fullWidth
            select
            label="Transaction Type"
            value={formData.transactionTypeId}
            onChange={handleChange('transactionTypeId')}
            error={!!errors.transactionTypeId}
            helperText={errors.transactionTypeId}
            margin="normal"
            required
            disabled={!!budget} // Cannot change transaction type when editing
          >
            {groupedTransactionTypes.map((group) => [
              <MenuItem key={`header-${group.category.id}`} disabled sx={{ fontWeight: 'bold', opacity: 1 }}>
                {group.category.name}
              </MenuItem>,
              ...group.transactionTypes.map((tt) => (
                <MenuItem key={tt.id} value={tt.id} sx={{ pl: 4 }}>
                  {tt.name}
                </MenuItem>
              )),
            ])}
          </TextField>

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
