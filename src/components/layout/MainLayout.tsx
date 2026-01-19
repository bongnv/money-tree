import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          py: 3,
        }}
      >
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[100],
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Money Tree
            {' · '}
            <Link href="/privacy.html" color="inherit" underline="hover">
              Privacy Policy
            </Link>
            {' · '}
            <Link href="/terms.html" color="inherit" underline="hover">
              Terms of Service
            </Link>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
