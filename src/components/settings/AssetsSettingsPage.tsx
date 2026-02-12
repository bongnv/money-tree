import { Container, Box } from '@mui/material';
import React from 'react';
import { AccountsPage } from '@/components/accounts/AccountsPage';
import { ManualAssetsPage } from '@/components/assets/ManualAssetsPage';

export const AssetsSettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <AccountsPage />
      <Box sx={{ mt: 6 }}>
        <ManualAssetsPage />
      </Box>
    </Container>
  );
};
