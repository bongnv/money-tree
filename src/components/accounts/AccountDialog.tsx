import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import React from 'react';
import type { Account } from '@/types/models';
import { AccountForm } from './AccountForm';

interface AccountDialogProps {
  open: boolean;
  account?: Account;
  onClose: () => void;
  onSubmit: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const AccountDialog: React.FC<AccountDialogProps> = ({
  open,
  account,
  onClose,
  onSubmit,
}) => {
  const handleSubmit = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    await onSubmit(accountData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{account ? 'Edit Account' : 'Create New Account'}</DialogTitle>
      <DialogContent>
        <AccountForm account={account} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
};
