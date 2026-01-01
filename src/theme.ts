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
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
};

// Create theme instance
const theme = createTheme(themeOptions);

export default theme;
