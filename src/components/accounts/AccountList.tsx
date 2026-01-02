import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import type { Account } from '../../types/models';
import { AccountCard } from './AccountCard';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export const AccountList: React.FC<AccountListProps> = ({ accounts, onEdit, onDelete }) => {
  if (accounts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No accounts yet. Create your first account to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {accounts.map((account) => (
        <Grid item xs={12} sm={6} md={4} key={account.id}>
          <AccountCard account={account} onEdit={onEdit} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  );
};
