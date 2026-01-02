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
import type { Account, Category, TransactionType } from '../../types/models';
import { Group } from '../../types/enums';

export interface TransactionFiltersState {
  dateFrom: string;
  dateTo: string;
  accountIds: string[];
  categoryId: string;
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

  const handleAccountChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    handleChange('accountIds', typeof value === 'string' ? value.split(',') : value);
  };

  const handleClearFilters = () => {
    onFiltersChange({
      dateFrom: '',
      dateTo: '',
      accountIds: [],
      categoryId: '',
      transactionTypeId: '',
      searchText: '',
      group: '',
    });
  };

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.accountIds.length > 0 ||
    filters.categoryId ||
    filters.transactionTypeId ||
    filters.searchText ||
    filters.group;

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        {/* Date Range */}
        <TextField
          label="From Date"
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleChange('dateFrom', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="To Date"
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleChange('dateTo', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        {/* Account Filter (Multi-select) */}
        <FormControl sx={{ minWidth: 200 }}>
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
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Groups</MenuItem>
          <MenuItem value={Group.EXPENSE}>Expense</MenuItem>
          <MenuItem value={Group.INCOME}>Income</MenuItem>
          <MenuItem value={Group.TRANSFER}>Transfer</MenuItem>
          <MenuItem value={Group.INVESTMENT}>Investment</MenuItem>
        </TextField>

        {/* Category Filter */}
        <TextField
          select
          label="Category"
          value={filters.categoryId}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Transaction Type Filter */}
        <TextField
          select
          label="Transaction Type"
          value={filters.transactionTypeId}
          onChange={(e) => handleChange('transactionTypeId', e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Types</MenuItem>
          {transactionTypes.map((type) => (
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
          sx={{ minWidth: 200, flexGrow: 1 }}
        />

        {/* Clear Filters Button */}
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          sx={{ minWidth: 120 }}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
};
