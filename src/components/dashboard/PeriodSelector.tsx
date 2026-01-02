import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  format,
} from 'date-fns';

export interface PeriodOption {
  label: string;
  startDate: string;
  endDate: string;
}

export interface PeriodSelectorProps {
  value: PeriodOption;
  onChange: (period: PeriodOption) => void;
}

const getPeriodOptions = (): PeriodOption[] => {
  const now = new Date();

  return [
    {
      label: 'This Month',
      startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    },
    {
      label: 'Last Month',
      startDate: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
    },
    {
      label: 'This Quarter',
      startDate: format(startOfQuarter(now), 'yyyy-MM-dd'),
      endDate: format(endOfQuarter(now), 'yyyy-MM-dd'),
    },
    {
      label: 'This Year',
      startDate: format(startOfYear(now), 'yyyy-MM-dd'),
      endDate: format(endOfYear(now), 'yyyy-MM-dd'),
    },
    {
      label: 'Year to Date',
      startDate: format(startOfYear(now), 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    },
  ];
};

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  const periods = getPeriodOptions();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedPeriod = periods.find((p) => p.label === event.target.value);
    if (selectedPeriod) {
      onChange(selectedPeriod);
    }
  };

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel id="period-selector-label">Period</InputLabel>
      <Select
        labelId="period-selector-label"
        id="period-selector"
        value={value.label}
        label="Period"
        onChange={handleChange}
      >
        {periods.map((period) => (
          <MenuItem key={period.label} value={period.label}>
            {period.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
