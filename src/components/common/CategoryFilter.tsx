import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  SxProps,
  Theme,
} from '@mui/material';
import type { Category } from '@/types/models';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onChange: (event: SelectChangeEvent<string[]>) => void;
  onClear: () => void;
  label?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategories,
  onChange,
  label = 'Categories',
  fullWidth = true,
  sx,
}) => {
  const labelId = `category-filter-label-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <FormControl fullWidth={fullWidth} sx={sx}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        multiple
        value={selectedCategories}
        label={label}
        onChange={onChange}
        renderValue={(selected) =>
          selected.length === 0
            ? 'All'
            : selected.length === 1
              ? categories.find((c) => c.id === selected[0])?.name || ''
              : `${selected.length} selected`
        }
      >
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            <Checkbox checked={selectedCategories.includes(category.id)} />
            <ListItemText primary={category.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
