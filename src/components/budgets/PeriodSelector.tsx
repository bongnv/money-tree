import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from '@mui/material';

export interface PeriodOption {
  label: string;
  startDate: string;
  endDate: string;
}

interface PeriodSelectorProps {
  value: string;
  onChange: (period: PeriodOption) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based

  // Helper function to format date as YYYY-MM-DD without timezone issues
  const formatDate = (year: number, month: number, day: number): string => {
    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  };

  // Generate period options
  const periods: PeriodOption[] = [];

  // Add months for current year
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  for (let i = 0; i < 12; i++) {
    const monthEndDate = new Date(currentYear, i + 1, 0); // Last day of month
    const lastDay = monthEndDate.getDate();
    periods.push({
      label: `${monthNames[i]} ${currentYear}`,
      startDate: formatDate(currentYear, i + 1, 1),
      endDate: formatDate(currentYear, i + 1, lastDay),
    });
  }

  // Add quarters for current year
  const quarters = [
    { label: 'Q1', months: [1, 2, 3] },
    { label: 'Q2', months: [4, 5, 6] },
    { label: 'Q3', months: [7, 8, 9] },
    { label: 'Q4', months: [10, 11, 12] },
  ];

  quarters.forEach((quarter) => {
    const firstMonth = quarter.months[0];
    const lastMonth = quarter.months[2];
    const lastDayOfQuarter = new Date(currentYear, lastMonth, 0).getDate();
    periods.push({
      label: `${quarter.label} ${currentYear}`,
      startDate: formatDate(currentYear, firstMonth, 1),
      endDate: formatDate(currentYear, lastMonth, lastDayOfQuarter),
    });
  });

  // Add full year
  periods.push({
    label: `${currentYear}`,
    startDate: formatDate(currentYear, 1, 1),
    endDate: formatDate(currentYear, 12, 31),
  });

  // Add previous year
  periods.push({
    label: `${currentYear - 1}`,
    startDate: formatDate(currentYear - 1, 1, 1),
    endDate: formatDate(currentYear - 1, 12, 31),
  });

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedLabel = event.target.value;
    const period = periods.find((p) => p.label === selectedLabel);
    if (period) {
      onChange(period);
    }
  };

  // Set default to current month if no value
  const defaultPeriod = periods[currentMonth];
  const currentValue = value || defaultPeriod.label;

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel id="period-selector-label">Period</InputLabel>
      <Select
        labelId="period-selector-label"
        id="period-selector"
        value={currentValue}
        label="Period"
        onChange={handleChange}
      >
        <MenuItem disabled sx={{ fontWeight: 'bold', opacity: 1 }}>
          Months
        </MenuItem>
        {periods.slice(0, 12).map((period) => (
          <MenuItem key={period.label} value={period.label}>
            {period.label}
          </MenuItem>
        ))}
        <MenuItem disabled sx={{ fontWeight: 'bold', opacity: 1, mt: 1 }}>
          Quarters
        </MenuItem>
        {periods.slice(12, 16).map((period) => (
          <MenuItem key={period.label} value={period.label}>
            {period.label}
          </MenuItem>
        ))}
        <MenuItem disabled sx={{ fontWeight: 'bold', opacity: 1, mt: 1 }}>
          Years
        </MenuItem>
        {periods.slice(16).map((period) => (
          <MenuItem key={period.label} value={period.label}>
            {period.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
