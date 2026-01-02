import React, { useState } from 'react';
import { TextField, MenuItem, Box, Button } from '@mui/material';
import type { ManualAsset } from '../../types/models';
import { AssetType } from '../../types/enums';
import { getAllCurrencies } from '../../utils/currency.utils';
import { getTodayDate, toDateString } from '../../utils/date.utils';

interface ManualAssetFormProps {
  asset?: ManualAsset;
  onSubmit: (asset: Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const ManualAssetForm: React.FC<ManualAssetFormProps> = ({ asset, onSubmit, onCancel }) => {
  const currencies = getAllCurrencies();
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    type: asset?.type || AssetType.OTHER,
    value: asset?.value?.toString() || '0',
    currencyId: asset?.currencyId || 'usd',
    date: asset?.date || getTodayDate(),
    notes: asset?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Asset type is required';
    }

    const value = parseFloat(formData.value);
    if (isNaN(value)) {
      newErrors.value = 'Value must be a valid number';
    }

    if (!formData.currencyId) {
      newErrors.currencyId = 'Currency is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
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
      name: formData.name.trim(),
      type: formData.type,
      value: parseFloat(formData.value),
      currencyId: formData.currencyId,
      date: toDateString(formData.date),
      notes: formData.notes.trim() || undefined,
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

  const assetTypeLabels: Record<AssetType, string> = {
    [AssetType.REAL_ESTATE]: 'Real Estate',
    [AssetType.SUPERANNUATION]: 'Superannuation',
    [AssetType.INVESTMENT]: 'Investment',
    [AssetType.LIABILITY]: 'Liability',
    [AssetType.OTHER]: 'Other',
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <TextField
        fullWidth
        label="Asset Name"
        value={formData.name}
        onChange={handleChange('name')}
        error={!!errors.name}
        helperText={errors.name}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        select
        label="Asset Type"
        value={formData.type}
        onChange={handleChange('type')}
        error={!!errors.type}
        helperText={errors.type}
        margin="normal"
        required
      >
        {Object.values(AssetType).map((type) => (
          <MenuItem key={type} value={type}>
            {assetTypeLabels[type]}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Value"
        type="number"
        value={formData.value}
        onChange={handleChange('value')}
        error={!!errors.value}
        helperText={errors.value}
        margin="normal"
        required
        inputProps={{ step: '0.01' }}
      />

      <TextField
        fullWidth
        select
        label="Currency"
        value={formData.currencyId}
        onChange={handleChange('currencyId')}
        error={!!errors.currencyId}
        helperText={errors.currencyId}
        margin="normal"
        required
      >
        {currencies.map((currency) => (
          <MenuItem key={currency.id} value={currency.id}>
            {currency.code} - {currency.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Date"
        type="date"
        value={formData.date}
        onChange={handleChange('date')}
        error={!!errors.date}
        helperText={errors.date}
        margin="normal"
        required
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        fullWidth
        label="Notes"
        value={formData.notes}
        onChange={handleChange('notes')}
        margin="normal"
        multiline
        rows={3}
      />

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          {asset ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};
