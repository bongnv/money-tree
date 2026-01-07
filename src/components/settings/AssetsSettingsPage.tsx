import React from 'react';
import { Container, Box } from '@mui/material';
import { AccountsPage } from '../accounts/AccountsPage';
import { ManualAssetsPage } from '../assets/ManualAssetsPage';

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
