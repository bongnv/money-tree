import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Chip,
  SelectChangeEvent,
  Box,
  Typography,
} from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import { useAppStore } from '../../stores/useAppStore';

export const YearSelector: React.FC = () => {
  const { currentYear, setCurrentYear } = useAppStore();

  // For now, we'll show years from current DataFile structure
  // Later this will be populated from the multi-year data structure
  const availableYears = [currentYear];
  const currentYearNumber = new Date().getFullYear();

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    const selectedYear = Number(event.target.value);
    setCurrentYear(selectedYear);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CalendarIcon sx={{ fontSize: 20, opacity: 0.7 }} />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={currentYear}
          onChange={handleYearChange}
          sx={{
            color: 'inherit',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.4)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.6)',
            },
            '.MuiSvgIcon-root': {
              color: 'inherit',
            },
          }}
        >
          {availableYears.map((year) => (
            <MenuItem key={year} value={year}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>{year}</Typography>
                {year === currentYearNumber && (
                  <Chip label="Current" size="small" color="primary" />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
