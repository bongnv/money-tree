import React from 'react';
import { TextField, MenuItem, Box, Button } from '@mui/material';
import { FormDatePicker } from '../common/FormDatePicker';
import type { ManualAsset } from '../../types/models';
import { AssetType, CurrencyCode } from '../../types/enums';
import { getAllCurrencies } from '../../utils/currency.utils';
import { useAssetForm } from '@/hooks/assets/useAssetForm';

interface ManualAssetFormProps {
  asset?: ManualAsset;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  updateValueOnly?: boolean;
}

export const ManualAssetForm: React.FC<ManualAssetFormProps> = ({
  asset,
  onSubmit,
  onCancel,
  updateValueOnly = false,
}) => {
  const currencies = getAllCurrencies();
  const mode = updateValueOnly ? 'update-value' : asset ? 'edit' : 'create';

  const { formData, errors, setField, handleSubmit } = useAssetForm({
    asset,
    mode,
    onSubmit,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  const assetTypeLabels: Record<AssetType, string> = {
    [AssetType.REAL_ESTATE]: 'Real Estate',
    [AssetType.SUPERANNUATION]: 'Superannuation',
    [AssetType.STOCKS_AND_SHARES]: 'Stocks & Shares',
    [AssetType.LIABILITY]: 'Liability',
    [AssetType.OTHER]: 'Other',
  };

  return (
    <Box component="form" onSubmit={handleFormSubmit} noValidate>
      {!updateValueOnly && (
        <>
          <TextField
            fullWidth
            label="Asset Name"
            value={'name' in formData ? formData.name : ''}
            onChange={(e) => setField('name' as never, e.target.value as never)}
            error={!!errors.name}
            helperText={errors.name}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            select
            label="Asset Type"
            value={'type' in formData ? formData.type : AssetType.OTHER}
            onChange={(e) => setField('type' as never, e.target.value as AssetType as never)}
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
        </>
      )}

      <TextField
        fullWidth
        label="Value"
        type="number"
        value={formData.value}
        onChange={(e) => setField('value' as never, e.target.value as never)}
        error={!!errors.value}
        helperText={errors.value}
        margin="normal"
        required
        inputProps={{ step: '0.01' }}
      />

      {!updateValueOnly && (
        <TextField
          fullWidth
          select
          label="Currency"
          value={'currencyCode' in formData ? formData.currencyCode : CurrencyCode.USD}
          onChange={(e) => setField('currencyCode' as never, e.target.value as CurrencyCode as never)}
          error={!!errors.currencyCode}
          helperText={errors.currencyCode}
          margin="normal"
          required
        >
          {currencies.map((currency) => (
            <MenuItem key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </MenuItem>
          ))}
        </TextField>
      )}

      <FormDatePicker
        label="Date"
        value={formData.date}
        onChange={(date) => setField('date' as never, date as never)}
        error={!!errors.date}
        helperText={errors.date}
        required
      />

      {!updateValueOnly && (
        <TextField
          fullWidth
          label="Notes"
          value={'notes' in formData ? formData.notes || '' : ''}
          onChange={(e) => setField('notes' as never, e.target.value as never)}
          margin="normal"
          multiline
          rows={3}
        />
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          {asset ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};
