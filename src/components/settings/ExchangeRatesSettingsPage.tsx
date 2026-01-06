import React from 'react';
import { Container } from '@mui/material';
import { ExchangeRatesSettings } from './ExchangeRatesSettings';

export const ExchangeRatesSettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <ExchangeRatesSettings />
    </Container>
  );
};
