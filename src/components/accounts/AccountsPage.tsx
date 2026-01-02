import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { Account } from '../../types/models';
import { useAccountStore } from '../../stores/useAccountStore';
import { AccountList } from './AccountList';
import { AccountDialog } from './AccountDialog';

export const AccountsPage: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount } = useAccountStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | undefined>();

  const handleOpenDialog = () => {
    setSelectedAccount(undefined);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAccount(undefined);
  };

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setDialogOpen(true);
  };

  const handleDelete = (account: Account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete.id);
    }
    setDeleteDialogOpen(false);
    setAccountToDelete(undefined);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAccountToDelete(undefined);
  };

  const handleSubmit = (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedAccount) {
      updateAccount(selectedAccount.id, accountData);
    } else {
      const newAccount: Account = {
        ...accountData,
        id: `acc-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addAccount(newAccount);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Accounts
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog}>
          New Account
        </Button>
      </Box>

      <AccountList accounts={accounts} onEdit={handleEdit} onDelete={handleDelete} />

      <AccountDialog
        open={dialogOpen}
        account={selectedAccount}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{accountToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
