import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, Button } from '@mui/material';
import theme from './theme';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Money Tree
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
            Personal Finance Manager
          </Typography>
          <Button variant="contained" color="primary" sx={{ mt: 2 }}>
            Get Started
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default App;
