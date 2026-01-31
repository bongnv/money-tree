import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { Account } from '../../types/models';
import { AccountList } from './AccountList';
import { AccountDialog } from './AccountDialog';
import { useActiveAccounts } from '../../hooks/useAccounts';
import { useAccountService } from '@/hooks/useServices';
import { useAccountDialog } from '@/hooks/accounts/useAccountDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export const AccountsPage: React.FC = () => {
  const accounts = useActiveAccounts();
  const accountService = useAccountService();
  const accountDialog = useAccountDialog();
  const [deleteAccount, setDeleteAccount] = React.useState<Account | null>(null);

  const handleOpenDialog = () => {
    accountDialog.openCreate();
  };

  const handleEdit = (account: Account) => {
    accountDialog.openEdit(account);
  };

  const handleDelete = (account: Account) => {
    setDeleteAccount(account);
  };

  const handleConfirmDelete = async () => {
    if (deleteAccount?.id) {
      await accountService.delete(deleteAccount.id);
      setDeleteAccount(null);
    }
  };

  const handleSubmit = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (accountDialog.selectedItem?.id) {
      await accountService.update(accountDialog.selectedItem.id, accountData);
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
        open={accountDialog.isOpen}
        account={accountDialog.selectedItem || undefined}
        onClose={accountDialog.close}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteAccount}
        title="Delete Account"
        message={`Are you sure you want to delete "${deleteAccount?.name}"? This will also remove all associated transactions.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteAccount(null)}
        confirmText="Delete"
        severity="error"
      />
    </Box>
  );
};
