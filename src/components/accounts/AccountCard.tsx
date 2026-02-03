import React from 'react';
import { Card, CardContent, CardActions, Typography, IconButton, Box, Chip } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
} from '@mui/icons-material';
import type { Account } from '../../types/models';
import { formatCurrency } from '../../utils/currency.utils';
import { useCalculationService } from '@/hooks/useServices';
import { useStore } from '@/contexts/StoreContext';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onArchive: (account: Account) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const { transactions } = useStore();
  const calculationService = useCalculationService();
  const currentBalance = calculationService.calculateAccountBalance(account, transactions || []);

  const handleEdit = () => {
    onEdit(account);
  };

  const handleDelete = () => {
    onDelete(account);
  };

  const handleArchive = () => {
    onArchive(account);
  };

  return (
    <Card sx={{ opacity: account.isActive === false ? 0.6 : 1 }}>
      <CardContent>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" component="h3">
              {account.name}
            </Typography>
            {account.isActive === false && (
              <Chip label="Archived" size="small" color="default" variant="outlined" />
            )}
          </Box>
          <Chip label={account.type.replace('_', ' ').toUpperCase()} size="small" color="primary" />
        </Box>
        <Typography variant="h5" color="primary" gutterBottom>
          {formatCurrency(currentBalance, account.currencyCode)}
        </Typography>
        {account.description && (
          <Typography variant="body2" color="text.secondary">
            {account.description}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton size="small" onClick={handleEdit} aria-label={`Edit ${account.name}`}>
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleArchive}
          aria-label={
            account.isActive === false ? `Unarchive ${account.name}` : `Archive ${account.name}`
          }
          color={account.isActive === false ? 'success' : 'default'}
        >
          {account.isActive === false ? <UnarchiveIcon /> : <ArchiveIcon />}
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
