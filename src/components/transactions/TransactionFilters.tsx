import {
  Box,
  TextField,
  MenuItem,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import { PeriodSelector } from '../common/PeriodSelector';
import { CategoryFilter } from '../common/CategoryFilter';
import type { Account, Category, TransactionType } from '../../types/models';
import { Group } from '../../types/enums';

export interface TransactionFiltersState {
  dateFrom: string;
  dateTo: string;
  accountIds: string[];
  categoryIds: string[];
  transactionTypeId: string;
  searchText: string;
  group: Group | '';
}

interface TransactionFiltersProps {
  accounts: Account[];
  categories: Category[];
  transactionTypes: TransactionType[];
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  accounts,
  categories,
  transactionTypes,
  filters,
  onFiltersChange,
}) => {
  const handleChange = (field: keyof TransactionFiltersState, value: string | string[]) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    onFiltersChange({
      ...filters,
      dateFrom: range.startDate,
      dateTo: range.endDate,
    });
  };

  const handleAccountChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    handleChange('accountIds', typeof value === 'string' ? value.split(',') : value);
  };

  const handleClearFilters = () => {
    onFiltersChange({
      dateFrom: '',
      dateTo: '',
      accountIds: [],
      categoryIds: [],
      transactionTypeId: '',
      searchText: '',
      group: '',
    });
  };

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.accountIds.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.transactionTypeId ||
    filters.searchText ||
    filters.group;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* First Row: Primary Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          {/* Date Range Filter */}
          <PeriodSelector
            startDate={filters.dateFrom}
            endDate={filters.dateTo}
            onChange={handleDateRangeChange}
            allowCustom={true}
            sx={{ minWidth: 200, flexGrow: 1, maxWidth: 280 }}
          />

          {/* Account Filter (Multi-select) */}
          <FormControl sx={{ minWidth: 200, flexGrow: 1, maxWidth: 280 }}>
            <InputLabel id="account-filter-label">Accounts</InputLabel>
            <Select
              labelId="account-filter-label"
              multiple
              value={filters.accountIds}
              onChange={handleAccountChange}
              input={<OutlinedInput label="Accounts" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((id) => {
                    const account = accounts.find((a) => a.id === id);
                    return <Chip key={id} label={account?.name || id} size="small" />;
                  })}
                </Box>
              )}
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Group Filter */}
          <TextField
            select
            label="Group"
            value={filters.group}
            onChange={(e) => handleChange('group', e.target.value)}
            sx={{ minWidth: 150, flexGrow: 1, maxWidth: 200 }}
          >
            <MenuItem value="">All Groups</MenuItem>
            <MenuItem value={Group.EXPENSE}>Expense</MenuItem>
            <MenuItem value={Group.INCOME}>Income</MenuItem>
            <MenuItem value={Group.TRANSFER}>Transfer</MenuItem>
            <MenuItem value={Group.ASSET_PURCHASE}>Asset Purchase</MenuItem>
            <MenuItem value={Group.ASSET_SALE}>Asset Sale</MenuItem>
          </TextField>
        </Box>

        {/* Second Row: Additional Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategories={filters.categoryIds}
            onChange={(event) => {
              const value = event.target.value;
              handleChange('categoryIds', typeof value === 'string' ? value.split(',') : value);
            }}
            onClear={() => handleChange('categoryIds', [])}
            label="Categories"
            fullWidth={false}
            sx={{ minWidth: 180, flexGrow: 1, maxWidth: 250 }}
          />

          {/* Transaction Type Filter */}
          <TextField
            select
            label="Transaction Type"
            value={filters.transactionTypeId}
            onChange={(e) => handleChange('transactionTypeId', e.target.value)}
            sx={{ minWidth: 180, flexGrow: 1, maxWidth: 250 }}
          >
            <MenuItem value="">All Types</MenuItem>
            {transactionTypes
              .filter((type) => type.isActive !== false)
              .map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
          </TextField>

          {/* Search */}
          <TextField
            label="Search Description"
            value={filters.searchText}
            onChange={(e) => handleChange('searchText', e.target.value)}
            placeholder="Search..."
            sx={{ minWidth: 200, flexGrow: 2 }}
          />

          {/* Clear Filters Button */}
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            sx={{ minWidth: 100 }}
          >
            Clear
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
