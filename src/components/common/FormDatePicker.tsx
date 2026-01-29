import React, { useMemo } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enAU, enGB, enUS } from 'date-fns/locale';
import { parse, format } from 'date-fns';
import type { SxProps, Theme } from '@mui/material';

interface FormDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

/**
 * Reusable date picker component that uses MUI DatePicker
 * Handles conversion between ISO date strings (YYYY-MM-DD) and Date objects
 * Uses browser locale for date formatting
 */
export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  fullWidth = true,
  required,
  size = 'medium',
  sx,
}) => {
  // Detect browser locale and map to date-fns locale
  const locale = useMemo(() => {
    const browserLocale = navigator.language.toLowerCase();

    // Map common browser locales to date-fns locales
    if (browserLocale.startsWith('en-au')) return enAU;
    if (browserLocale.startsWith('en-gb')) return enGB;
    if (browserLocale.startsWith('en')) return enUS;

    // Default to enUS if locale not supported
    return enUS;
  }, []);

  // Convert ISO string (YYYY-MM-DD) to Date object
  const dateValue = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;

  const handleChange = (newValue: Date | null) => {
    if (newValue && !isNaN(newValue.getTime())) {
      // Convert Date to ISO date string (YYYY-MM-DD)
      onChange(format(newValue, 'yyyy-MM-dd'));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
      <DatePicker
        label={label}
        value={dateValue}
        onChange={handleChange}
        disabled={disabled}
        sx={sx}
        slotProps={{
          textField: {
            fullWidth,
            margin: fullWidth ? 'normal' : 'none',
            error,
            helperText,
            required,
            size,
          },
        }}
      />
    </LocalizationProvider>
  );
};
