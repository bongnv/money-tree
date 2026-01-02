import React, { useState } from 'react';
import { Container, Typography, Tabs, Tab, Box } from '@mui/material';
import { AccountsPage } from '../accounts/AccountsPage';
import { ManualAssetsPage } from '../assets/ManualAssetsPage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const AssetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Assets
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="Transactional" />
        <Tab label="Manual" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <AccountsPage />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ManualAssetsPage />
      </TabPanel>
    </Container>
  );
};
