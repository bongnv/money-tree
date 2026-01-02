import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Account } from '../../types/models';
import { formatCurrency } from '../../utils/currency.utils';
import { calculationService } from '../../services/calculation.service';
import { useTransactionStore } from '../../stores/useTransactionStore';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onDelete,
}) => {
  const { transactions } = useTransactionStore();
  const currentBalance = calculationService.calculateAccountBalance(account, transactions);

  const handleEdit = () => {
    onEdit(account);
  };

  const handleDelete = () => {
    onDelete(account);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3">
            {account.name}
          </Typography>
          <Chip
            label={account.type.replace('_', ' ').toUpperCase()}
            size="small"
            color={account.isActive ? 'success' : 'default'}
          />
        </Box>
        <Typography variant="h5" color="primary" gutterBottom>
          {formatCurrency(currentBalance, account.currencyId)}
        </Typography>
        {account.description && (
          <Typography variant="body2" color="text.secondary">
            {account.description}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton
          size="small"
          onClick={handleEdit}
          aria-label={`Edit ${account.name}`}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleDelete}
          aria-label={`Delete ${account.name}`}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};
