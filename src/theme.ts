import { createTheme, ThemeOptions } from '@mui/material/styles';

// Define theme options
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32', // Green for money/growth theme
      light: '#60ad5e',
      dark: '#005005',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1976d2', // Blue for secondary actions
      light: '#63a4ff',
      dark: '#004ba0',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f', // Red for expenses/errors
    },
    warning: {
      main: '#ed6c02', // Orange for warnings
    },
    info: {
      main: '#0288d1', // Blue for info
    },
    success: {
      main: '#2e7d32', // Green for success/income
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Don't uppercase button text
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          transition: 'transform 0.2s ease-in-out',
        },
      },
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
};

// Create theme instance
const theme = createTheme(themeOptions);

// Chart color constants for consistent data visualization
export const CHART_COLORS = {
  // Income colors (green shades)
  income: {
    target: theme.palette.primary.dark, // Darker green for budgeted/target #005005
    actual: theme.palette.primary.main, // Main green for actual #2e7d32
  },
  // Expense colors (red/orange shades)
  expense: {
    budgeted: theme.palette.error.main, // Red for budgeted #d32f2f
    actual: theme.palette.warning.main, // Orange for actual #ed6c02
  },
  // Simple semantic colors (for charts without actual/budget distinction)
  simple: {
    income: theme.palette.success.main, // Green #2e7d32
    expense: theme.palette.error.main, // Red #d32f2f
    netCashFlow: theme.palette.info.main, // Blue for net #0288d1
  },
  // Alternative colors for multi-series charts
  alt1: theme.palette.info.main, // Light blue #0288d1
  alt2: theme.palette.secondary.main, // Blue #1976d2
  // For positive/negative indicators
  positive: theme.palette.success.main, // Green
  negative: theme.palette.error.main, // Red
} as const;

export default theme;
