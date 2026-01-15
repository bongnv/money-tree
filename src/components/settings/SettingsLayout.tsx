import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab } from '@mui/material';
import {
  AccountBalanceWallet as AccountsIcon,
  Category as CategoryIcon,
  CurrencyExchange as ExchangeRateIcon,
  Archive as ArchiveIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const navItems = [
  { path: '/settings/preferences', label: 'Preferences', icon: <SettingsIcon /> },
  { path: '/settings/accounts', label: 'Assets', icon: <AccountsIcon /> },
  { path: '/settings/categories', label: 'Categories', icon: <CategoryIcon /> },
  { path: '/settings/exchange-rates', label: 'Exchange Rates', icon: <ExchangeRateIcon /> },
  { path: '/settings/archives', label: 'Archives', icon: <ArchiveIcon /> },
];

export const SettingsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect from /settings to /settings/preferences
  useEffect(() => {
    if (location.pathname === '/settings') {
      navigate('/settings/preferences', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  // Default to preferences if on base route
  const currentTab =
    location.pathname === '/settings' ? '/settings/preferences' : location.pathname;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="settings navigation"
        >
          {navItems.map((item) => (
            <Tab
              key={item.path}
              label={item.label}
              value={item.path}
              icon={item.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};
