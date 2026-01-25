import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CircularProgress,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Sync as SyncIcon,
  Dashboard as DashboardIcon,
  ReceiptLong as TransactionsIcon,
  Assessment as ReportsIcon,
  AccountBalanceWallet as BudgetIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';
import { useLastSynced } from '../../hooks/queries';
import { useSyncService } from '../../contexts/SyncProvider';
import { formatDistance } from 'date-fns';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoading } = useAppContext();
  const syncService = useSyncService();
  const cloudFileName = syncService.fileName;
  const lastSynced = useLastSynced();

  const handleSync = async () => {
    try {
      await syncService.fullSync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const getLastSyncedText = (): string => {
    if (!lastSynced) {
      return 'Never synced';
    }
    try {
      return formatDistance(new Date(lastSynced), new Date(), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Transactions', path: '/transactions', icon: <TransactionsIcon /> },
    { label: 'Reports', path: '/reports', icon: <ReportsIcon /> },
    { label: 'Budgets', path: '/budgets', icon: <BudgetIcon /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/settings') {
      return (
        location.pathname.startsWith('/settings') ||
        location.pathname === '/accounts' ||
        location.pathname === '/categories' ||
        location.pathname === '/assets'
      );
    }
    return location.pathname === path;
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Desktop: Show Money Tree text */}
        {!isMobile && (
          <Typography
            variant="h6"
            component="div"
            onClick={() => navigate('/')}
            sx={{
              mr: 4,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            Money Tree
          </Typography>
        )}

        {/* Mobile Menu Button - positioned at start */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="menu"
            edge="start"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Mobile: Spacer */}
        {isMobile && <Box sx={{ flexGrow: 1 }} />}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {cloudFileName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{cloudFileName}</Typography>
            </Box>
          )}

          <Typography variant="caption" color="inherit" sx={{ opacity: 0.7 }}>
            {getLastSyncedText()}
          </Typography>

          <Button
            color="inherit"
            startIcon={
              isLoading || syncService.isSyncing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SyncIcon />
              )
            }
            onClick={handleSync}
            disabled={isLoading || syncService.isSyncing}
            aria-label="Sync"
          >
            Sync
          </Button>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={() => setMobileMenuOpen(false)}
        >
          {/* Money Tree branding in drawer */}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h6"
              component="div"
              onClick={() => handleNavigation('/')}
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                fontWeight: 'bold',
              }}
            >
              Money Tree
            </Typography>
          </Box>

          <List>
            {navItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={isActive(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};
