import React from 'react';
import { Container } from '@mui/material';
import { ArchiveManager } from './ArchiveManager';

export const ArchivesSettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <ArchiveManager />
    </Container>
  );
};
