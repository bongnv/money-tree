import React, { useMemo } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import type { SxProps, Theme } from '@mui/material';
import 'dayjs/locale/en-au';
import 'dayjs/locale/en-gb';
import 'dayjs/locale/en';

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
 * Handles conversion between ISO date strings (YYYY-MM-DD) and Dayjs objects
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
  // Detect browser locale and map to dayjs locale
  const locale = useMemo(() => {
    const browserLocale = navigator.language.toLowerCase();
    
    // Map common browser locales to dayjs locales
    if (browserLocale.startsWith('en-au')) return 'en-au';
    if (browserLocale.startsWith('en-gb')) return 'en-gb';
    if (browserLocale.startsWith('en')) return 'en';
    
    // Default to 'en' if locale not supported
    return 'en';
  }, []);

  // Convert ISO string to Dayjs with locale
  const dayjsValue = value ? dayjs(value).locale(locale) : null;

  const handleChange = (newValue: Dayjs | null) => {
    if (newValue && newValue.isValid()) {
      // Convert Dayjs to ISO date string (YYYY-MM-DD)
      onChange(newValue.format('YYYY-MM-DD'));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
      <DatePicker
        label={label}
        value={dayjsValue}
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
