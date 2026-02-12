import { Container } from '@mui/material';
import React from 'react';
import { ArchiveManager } from './ArchiveManager';

export const ArchivesSettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <ArchiveManager />
    </Container>
  );
};
