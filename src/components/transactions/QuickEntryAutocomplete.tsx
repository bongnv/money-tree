import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

interface QuickEntryAutocompleteProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  getOptionLabel: (option: T) => string;
  groupBy?: (option: T) => string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  sx?: Record<string, unknown>;
  minWidth?: number;
  inputRef?: React.Ref<HTMLDivElement>;
}

export function QuickEntryAutocomplete<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  groupBy,
  placeholder,
  error,
  helperText,
  sx,
  minWidth = 150,
  inputRef,
}: QuickEntryAutocompleteProps<T>) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Stop Enter from bubbling to form (MUI handles selection via autoHighlight)
    if (event.key === 'Enter') {
      event.stopPropagation();
    }
  };

  return (
    <Autocomplete
      ref={inputRef}
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      onKeyDown={handleKeyDown}
      getOptionLabel={getOptionLabel}
      groupBy={groupBy}
      disableClearable={false}
      openOnFocus
      autoHighlight
      size="small"
      renderInput={(params) => (
        <TextField {...params} placeholder={placeholder} error={error} helperText={helperText} />
      )}
      sx={{ minWidth, ...sx }}
    />
  );
}
