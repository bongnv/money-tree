import { Box, IconButton, Typography, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Transaction, Account, TransactionType, Category } from '../../types/models';
import { formatDate } from '../../utils/date.utils';
import { formatCurrency } from '../../utils/currency.utils';
import { Group } from '../../types/enums';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  transactionTypes: TransactionType[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  categories,
  transactionTypes,
  onEdit,
  onDelete,
}) => {
  const getTransactionType = (id: string) => transactionTypes.find((tt) => tt.id === id);
  const getCategory = (id: string) => categories.find((c) => c.id === id);
  const getAccount = (id?: string) => id ? accounts.find((a) => a.id === id) : undefined;

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      valueGetter: (_, row) => row.date,
      renderCell: (params: GridRenderCellParams) => formatDate(params.value),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 150,
      valueGetter: (_, row) => row.description || '—',
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      valueGetter: (_, row) => {
        const transactionType = getTransactionType(row.transactionTypeId);
        if (!transactionType) return '—';
        const category = getCategory(transactionType.categoryId);
        return category?.name || '—';
      },
      renderCell: (params: GridRenderCellParams) => {
        const transactionType = getTransactionType(params.row.transactionTypeId);
        if (!transactionType) return '—';
        const category = getCategory(transactionType.categoryId);
        if (!category) return '—';
        
        const colorMap: Record<Group, 'error' | 'success' | 'info' | 'warning'> = {
          [Group.EXPENSE]: 'error',
          [Group.INCOME]: 'success',
          [Group.TRANSFER]: 'info',
          [Group.INVESTMENT]: 'warning',
        };
        
        return (
          <Chip 
            label={category.name} 
            size="small" 
            color={colorMap[category.group]} 
          />
        );
      },
    },
    {
      field: 'transactionType',
      headerName: 'Type',
      width: 150,
      valueGetter: (_, row) => {
        const transactionType = getTransactionType(row.transactionTypeId);
        return transactionType?.name || '—';
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_, row) => row.amount,
      renderCell: (params: GridRenderCellParams) => {
        const fromAccount = getAccount(params.row.fromAccountId);
        const toAccount = getAccount(params.row.toAccountId);
        const account = fromAccount || toAccount;
        return formatCurrency(params.value, account?.currencyId || 'usd');
      },
    },
    {
      field: 'fromAccount',
      headerName: 'From',
      width: 130,
      valueGetter: (_, row) => {
        const account = getAccount(row.fromAccountId);
        return account?.name || '—';
      },
    },
    {
      field: 'toAccount',
      headerName: 'To',
      width: 130,
      valueGetter: (_, row) => {
        const account = getAccount(row.toAccountId);
        return account?.name || '—';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => onEdit(params.row)}
            aria-label="Edit transaction"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(params.row)}
            aria-label="Delete transaction"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (transactions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          No transactions yet. Click "New Transaction" to add one.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={transactions}
        columns={columns}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25, page: 0 },
          },
          sorting: {
            sortModel: [{ field: 'date', sort: 'desc' }],
          },
        }}
        disableRowSelectionOnClick
      />
    </Box>
  );
};
