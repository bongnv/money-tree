import { Add as AddIcon } from '@mui/icons-material';
import { Box, Typography, Button } from '@mui/material';
import React from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useStore } from '@/contexts/StoreContext';
import { useAccountDialog } from '@/hooks/accounts/useAccountDialog';
import type { Account } from '@/types/models';
import { AccountDialog } from './AccountDialog';
import { AccountList } from './AccountList';

export const AccountsPage: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount: deleteAccountOp } = useStore();
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

  const handleArchive = async (account: Account) => {
    if (account.isActive) {
      await updateAccount(account.id, { isActive: false });
    } else {
      await updateAccount(account.id, { isActive: true });
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteAccount?.id) {
      await deleteAccountOp(deleteAccount.id);
      setDeleteAccount(null);
    }
  };

  const handleSubmit = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (accountDialog.selectedItem?.id) {
      await updateAccount(accountDialog.selectedItem.id, accountData);
    } else {
      await addAccount(accountData);
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

      <AccountList
        accounts={accounts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
      />

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
