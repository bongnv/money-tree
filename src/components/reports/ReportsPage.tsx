import React from 'react';
import { Box, Container, Paper, Tabs, Tab, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const REPORT_TABS = [
  { label: 'Balance Sheet', path: '/reports/balance-sheet' },
  { label: 'Cash Flow', path: '/reports/cash-flow' },
  { label: 'Budget Performance', path: '/reports/budget-performance' },
];

export const ReportsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current tab based on URL
  const currentTab = REPORT_TABS.findIndex((tab) => location.pathname === tab.path);
  const activeTab = currentTab >= 0 ? currentTab : 0;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    navigate(REPORT_TABS[newValue].path);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Financial Reports
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {REPORT_TABS.map((tab) => (
              <Tab key={tab.path} label={tab.label} />
            ))}
          </Tabs>

          <Box>
            <Outlet />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
