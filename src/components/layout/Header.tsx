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
  CloudQueue as CloudQueueIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSync } from '@/contexts/SyncContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const syncOps = useSync();
  const { status, errorMessage, currentFile } = syncOps;
  const cloudFileName = currentFile?.name ?? null;

  const handleSync = async () => {
    try {
      if (status === 'offline') {
        await syncOps.reconnect();
      } else {
        await syncOps.fullSync();
      }
    } catch (error) {
      console.error('Sync operation failed:', error);
    }
  };

  const getSyncIcon = () => {
    switch (status) {
      case 'syncing':
        return <CircularProgress size={20} color="inherit" />;
      case 'error':
        return <ErrorIcon />;
      case 'synced':
        return <CloudDoneIcon />;
      case 'connected':
        return <CloudQueueIcon />;
      case 'offline':
      default:
        return <CloudOffIcon />;
    }
  };

  const getSyncLabel = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing';
      case 'error':
        return errorMessage || 'Sync error';
      case 'synced':
        return 'Synced';
      case 'connected':
        return 'Connected';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getSyncColor = () => {
    switch (status) {
      case 'error':
        return 'error.main';
      case 'offline':
      case 'connected':
        return 'warning.main';
      default:
        return 'inherit';
    }
  };

  const getTooltip = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing in progress...';
      case 'error':
        return `Error: ${errorMessage || 'Unknown error'}. Click to retry`;
      case 'synced':
        return 'Synced - Click to sync again';
      case 'connected':
        return 'Click to sync';
      case 'offline':
        return 'Click to reconnect';
      default:
        return 'Sync status unknown';
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

          <Tooltip title={getTooltip()} arrow>
            <span>
              <IconButton
                color="inherit"
                onClick={handleSync}
                disabled={status === 'syncing'}
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
