import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { DEFAULT_CURRENCIES } from '../../constants/defaults';
import { DataSyncSettings } from './DataSyncSettings';
import { CurrencyCode } from '../../types/enums';
import { useStore } from '@/contexts/StoreContext';

export const PreferencesPage: React.FC = () => {
  const { baseCurrency, setBaseCurrency } = useStore();
  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    await setBaseCurrency(newCurrency);
  };

  return (
    <Box data-testid="preferences-page">
      <Typography variant="h4" gutterBottom>
        Preferences
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Currency Settings
        </Typography>

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="base-currency-label">Base Currency</InputLabel>
          <Select
            labelId="base-currency-label"
            id="base-currency-select"
            value={baseCurrency}
            label="Base Currency"
            onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
          >
            {DEFAULT_CURRENCIES.map((currency) => (
              <MenuItem key={currency.code} value={currency.code}>
                {currency.code} - {currency.name} ({currency.symbol})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          The base currency is used as the default display currency for all financial reports. All
          multi-currency accounts and assets will be converted to this currency using exchange
          rates. You can temporarily view reports in different currencies, but they will reset to
          this base currency when you navigate away.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary">
          <strong>Note:</strong> Changing the base currency will recalculate all reports using the
          new currency. This setting is saved in your data file and will sync across devices.
        </Typography>
      </Paper>

      {/* Data & Sync Settings */}
      <Box sx={{ mt: 3 }}>
        <DataSyncSettings />
      </Box>
    </Box>
  );
};
