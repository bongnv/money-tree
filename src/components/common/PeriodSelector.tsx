import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { getTodayDate } from '../../utils/date.utils';
import { FormDatePicker } from './FormDatePicker';

export interface PeriodOption {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}

interface PeriodSelectorProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  presets?: PeriodOption[]; // Custom presets - if not provided, uses default
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  label?: string;
  allowCustom?: boolean;
  sx?: SxProps<Theme>;
}

const formatDate = (year: number, month: number, day: number): string => {
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
};

// Default presets - comprehensive set for dashboard and reports
export const getDefaultPresets = (today: string): PeriodOption[] => {
  const [year, month, day] = today.split('-').map(Number);
  const todayDate = new Date(year, month - 1, day);

  const getRange = (startDate: Date, endDate: Date) => ({
    startDate: formatDate(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()),
    endDate: formatDate(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()),
  });

  return [
    {
      label: 'This Month',
      value: 'this-month',
      ...getRange(
        new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
        new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0)
      ),
    },
    {
      label: 'Last Month',
      value: 'last-month',
      ...getRange(
        new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1),
        new Date(todayDate.getFullYear(), todayDate.getMonth(), 0)
      ),
    },
    {
      label: 'This Quarter',
      value: 'this-quarter',
      ...getRange(
        new Date(todayDate.getFullYear(), Math.floor(todayDate.getMonth() / 3) * 3, 1),
        new Date(todayDate.getFullYear(), Math.floor(todayDate.getMonth() / 3) * 3 + 3, 0)
      ),
    },
    {
      label: 'Last Quarter',
      value: 'last-quarter',
      ...getRange(
        new Date(todayDate.getFullYear(), Math.floor(todayDate.getMonth() / 3) * 3 - 3, 1),
        new Date(todayDate.getFullYear(), Math.floor(todayDate.getMonth() / 3) * 3, 0)
      ),
    },
    {
      label: 'Year to Date',
      value: 'year-to-date',
      ...getRange(new Date(todayDate.getFullYear(), 0, 1), todayDate),
    },
    {
      label: 'This Year',
      value: 'this-year',
      ...getRange(
        new Date(todayDate.getFullYear(), 0, 1),
        new Date(todayDate.getFullYear(), 11, 31)
      ),
    },
    {
      label: 'Last Year',
      value: 'last-year',
      ...getRange(
        new Date(todayDate.getFullYear() - 1, 0, 1),
        new Date(todayDate.getFullYear() - 1, 11, 31)
      ),
    },
  ];
};

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  startDate,
  endDate,
  onChange,
  presets: customPresets,
  size,
  fullWidth = false,
  label = 'Period',
  allowCustom = true,
  sx,
}) => {
  const today = getTodayDate();
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string>(endDate);

  const presets = React.useMemo(() => {
    return customPresets || getDefaultPresets(today);
  }, [customPresets, today]);

  // Find matching preset or use custom
  const selectedPreset = presets.find((p) => p.startDate === startDate && p.endDate === endDate);
  const selectedValue = selectedPreset?.value || 'custom';

  const handlePeriodChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value;

    if (newValue === 'custom') {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setCustomDateDialogOpen(true);
      return;
    }

    const period = presets.find((p) => p.value === newValue);
    if (period) {
      onChange({
        startDate: period.startDate,
        endDate: period.endDate,
      });
    }
  };

  const handleApplyCustomDates = () => {
    onChange({
      startDate: tempStartDate,
      endDate: tempEndDate,
    });
    setCustomDateDialogOpen(false);
  };

  const handleCancelCustomDates = () => {
    setCustomDateDialogOpen(false);
  };

  const renderValue = (value: string) => {
    if (value === 'custom') {
      // Handle empty dates - show "All Periods" (no date filter)
      if (!startDate || !endDate) {
        return 'All Periods';
      }
      // Format dates compactly (e.g., "01/15 - 02/28")
      const formatCompact = (dateStr: string) => {
        const [, m, d] = dateStr.split('-');
        return `${m}/${d}`;
      };
      return `${formatCompact(startDate)} - ${formatCompact(endDate)}`;
    }
    const preset = presets.find((p) => p.value === value);
    return preset?.label || value;
  };

  return (
    <>
      <FormControl fullWidth={fullWidth} size={size} sx={sx}>
        <InputLabel id="period-selector-label">{label}</InputLabel>
        <Select
          labelId="period-selector-label"
          value={selectedValue}
          label={label}
          onChange={handlePeriodChange}
          renderValue={renderValue}
          data-testid="period-selector"
          inputProps={{ 'data-testid': 'period-selector-input' }}
        >
          {presets.map((preset) => (
            <MenuItem key={preset.value} value={preset.value}>
              {preset.label}
            </MenuItem>
          ))}
          {allowCustom && <MenuItem value="custom">Custom Range...</MenuItem>}
        </Select>
      </FormControl>

      {allowCustom && (
        <Dialog open={customDateDialogOpen} onClose={handleCancelCustomDates}>
          <DialogTitle>Select Custom Date Range</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, minWidth: 300 }}>
              <FormDatePicker
                label="Start Date"
                value={tempStartDate}
                onChange={setTempStartDate}
              />
              <FormDatePicker label="End Date" value={tempEndDate} onChange={setTempEndDate} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelCustomDates}>Cancel</Button>
            <Button onClick={handleApplyCustomDates} variant="contained">
              Apply
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
