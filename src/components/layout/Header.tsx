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
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ReceiptLong as TransactionsIcon,
  Assessment as ReportsIcon,
  AccountBalanceWallet as BudgetIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';
import { useSyncService } from '../../contexts/SyncProvider';
import { useLastModified } from '../../hooks/useSyncMetadata';
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
  const remoteLastModified = syncService.remoteLastModified;
  const lastSyncError = syncService.lastSyncError;

  // Watch local lastModified to determine if we're truly in sync
  const lastModified = useLastModified();

  const handleSync = async () => {
    try {
      await syncService.fullSync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const getLastSyncedText = (): string => {
    if (!remoteLastModified) {
      return 'Never synced';
    }
    try {
      return formatDistance(new Date(remoteLastModified), new Date(), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getSyncStatus = (): 'syncing' | 'synced' | 'not-synced' | 'error' => {
    if (syncService.isSyncing) return 'syncing';
    if (lastSyncError) return 'error';
    if (!remoteLastModified) return 'not-synced';
    // Only show synced if remote matches local
    if (lastModified && remoteLastModified === lastModified) return 'synced';
    return 'not-synced';
  };

  const getSyncIcon = () => {
    const status = getSyncStatus();
    switch (status) {
      case 'syncing':
        return <CircularProgress size={20} color="inherit" />;
      case 'error':
        return <ErrorIcon />;
      case 'not-synced':
        return <CloudOffIcon />;
      case 'synced':
        return <CloudDoneIcon />;
    }
  };

  const getSyncLabel = () => {
    const status = getSyncStatus();
    switch (status) {
      case 'syncing':
        return 'Syncing';
      case 'error':
        return 'Error';
      case 'not-synced':
        return 'Not Synced';
      case 'synced':
        return 'Synced';
    }
  };

  const getSyncColor = () => {
    const status = getSyncStatus();
    switch (status) {
      case 'error':
        return 'error.main';
      case 'not-synced':
        return 'warning.main';
      default:
        return 'inherit';
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

          <Tooltip title={getSyncLabel()} arrow>
            <span>
              <IconButton
                color="inherit"
                onClick={handleSync}
                disabled={isLoading || syncService.isSyncing}
                aria-label={getSyncLabel()}
                sx={{
                  color: getSyncColor(),
                }}
              >
                {getSyncIcon()}
              </IconButton>
            </span>
          </Tooltip>
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
