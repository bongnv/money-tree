import React, { useState } from 'react';
import { Box, Container, Paper, Tabs, Tab, Typography } from '@mui/material';
import { BalanceSheet } from './BalanceSheet';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const ReportsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Financial Reports
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Balance Sheet" />
            <Tab label="Cash Flow" disabled />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <BalanceSheet />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Cash Flow report coming soon
              </Typography>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};
