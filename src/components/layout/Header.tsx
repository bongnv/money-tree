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
  Save as SaveIcon,
  FolderOpen as FolderOpenIcon,
  FiberManualRecord as DotIcon,
  ReceiptLong as TransactionsIcon,
  Assessment as ReportsIcon,
  AccountBalanceWallet as BudgetIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';
import { formatDistance } from 'date-fns';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { fileName, lastSaved, hasUnsavedChanges, isLoading, currentYear } = useAppStore();

  const handleLoad = async () => {
    try {
      const canProceed = await syncService.promptSaveIfNeeded();
      if (!canProceed) {
        return;
      }

      await syncService.loadDataFile(currentYear);
    } catch (error) {
      console.error('Load failed:', error);
    }
  };

  const handleSave = async () => {
    try {
      await syncService.saveNow();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const getLastSavedText = (): string => {
    if (!lastSaved) {
      return 'Never saved';
    }
    try {
      return formatDistance(new Date(lastSaved), new Date(), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const navItems = [
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
    if (path === '/settings') {
      return location.pathname.startsWith('/settings') ||
             location.pathname === '/accounts' ||
             location.pathname === '/categories' ||
             location.pathname === '/assets';
    }
    return location.pathname === path;
  };

  return (
    <AppBar position="static">
      <Toolbar>
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
                  backgroundColor: isActive(item.path)
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'transparent',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              color="inherit"
              aria-label="menu"
              edge="start"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          </>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {fileName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{fileName}</Typography>
              {hasUnsavedChanges && <DotIcon sx={{ fontSize: 12, color: 'warning.main' }} />}
            </Box>
          )}

          <Typography variant="caption" color="inherit" sx={{ opacity: 0.7 }}>
            {getLastSavedText()}
          </Typography>

          <Button
            color="inherit"
            startIcon={<FolderOpenIcon />}
            onClick={handleLoad}
            disabled={isLoading}
          >
            Load
          </Button>

          <Button
            color="inherit"
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
          >
            Save
          </Button>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={() => setMobileMenuOpen(false)}
        >
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
