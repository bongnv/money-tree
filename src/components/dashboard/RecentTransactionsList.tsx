import React from 'react';
import { Box, Typography, Button, Paper, IconButton, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useTransactionTypes } from '../../hooks/queries/useTransactionTypes';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { formatDate } from '../../utils/date.utils';
import { formatCurrency } from '../../utils/currency.utils';
import { Group, CurrencyCode } from '../../types/enums';

export interface RecentTransactionsListProps {
  limit?: number;
  onEdit?: (transactionId: string) => void;
  onDelete?: (transactionId: string) => void;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  limit = 10,
  onEdit,
  onDelete,
}) => {
  const transactions = useTransactions();
  const transactionTypes = useTransactionTypes();
  const accounts = useAccounts();

  // Get recent transactions sorted by date (newest first)
  const recentTransactions = transactions
    ? [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
    : [];

  if (recentTransactions.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          No transactions yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add your first transaction using the form above
        </Typography>
      </Paper>
    );
  }

  const getTransactionTypeName = (transactionTypeId: string): string => {
    const type = transactionTypes?.find((t) => t.id === transactionTypeId);
    return type?.name || 'Unknown';
  };

  const isIncome = (transactionTypeId: string): boolean => {
    const type = transactionTypes?.find((t) => t.id === transactionTypeId);
    if (!type) return false;
    return type.group === Group.INCOME;
  };

  const getTransactionCurrency = (transaction: {
    toAccountId?: string;
    fromAccountId?: string;
  }): CurrencyCode => {
    // For income, use toAccountId; for expenses, use fromAccountId
    const accountId = transaction.toAccountId || transaction.fromAccountId;
    if (!accountId) return CurrencyCode.USD; // Fallback if no account
    const account = accounts?.find((a) => a.id === accountId);
    return account?.currencyCode || CurrencyCode.USD;
  };

  const formatTransactionAmount = (
    amount: number,
    transactionTypeId: string,
    currencyCode: CurrencyCode
  ): string => {
    const formattedAmount = formatCurrency(amount, currencyCode, { showSymbol: true });
    return isIncome(transactionTypeId) ? `+${formattedAmount}` : formattedAmount;
  };

  return (
    <Box>
      {recentTransactions.map((transaction) => (
        <Paper
          key={transaction.id}
          sx={{
            px: 2,
            py: 1,
            mb: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>
              {formatDate(transaction.date)}
            </Typography>
            <Typography variant="body2" fontWeight="medium" sx={{ flex: 1, minWidth: 0 }}>
              {transaction.description}
            </Typography>
            <Chip
              label={getTransactionTypeName(transaction.transactionTypeId)}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <Typography
              variant="body2"
              fontWeight="medium"
              color={isIncome(transaction.transactionTypeId) ? 'success.main' : 'text.primary'}
              sx={{ minWidth: 80, textAlign: 'right' }}
            >
              {formatTransactionAmount(
                transaction.amount,
                transaction.transactionTypeId,
                getTransactionCurrency(transaction)
              )}
            </Typography>
            {onEdit && (
              <IconButton
                size="small"
                onClick={() => onEdit(transaction.id)}
                aria-label="edit transaction"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                size="small"
                onClick={() => onDelete(transaction.id)}
                aria-label="delete transaction"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Paper>
      ))}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button component={RouterLink} to="/transactions" variant="text" color="primary">
          View All Transactions
        </Button>
      </Box>
    </Box>
  );
};
