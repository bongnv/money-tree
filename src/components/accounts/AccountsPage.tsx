import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { accountService } from '../../services/account.service';
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
import { AccountList } from './AccountList';
import { AccountDialog } from './AccountDialog';

export const AccountsPage: React.FC = () => {
  const accounts = useLiveQuery(() => accountService.getActive()) ?? [];
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

  const handleConfirmDelete = async () => {
    if (accountToDelete?.id) {
      await accountService.delete(accountToDelete.id);
    }
    setDeleteDialogOpen(false);
    setAccountToDelete(undefined);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAccountToDelete(undefined);
  };

  const handleSubmit = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedAccount?.id) {
      await accountService.update(selectedAccount.id, accountData);
    } else {
      await accountService.create(accountData);
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

      <AccountList accounts={accounts || []} onEdit={handleEdit} onDelete={handleDelete} />

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
            Are you sure you want to delete &quot;{accountToDelete?.name}&quot;? This action cannot
            be undone.
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
