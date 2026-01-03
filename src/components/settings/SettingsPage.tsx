import React from 'react';
import { Container, Typography, Grid, Card, CardActionArea, CardContent, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import SyncIcon from '@mui/icons-material/Sync';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure your assets, categories, and data sync
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardActionArea onClick={() => navigate('/settings/assets')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AccountBalanceIcon fontSize="large" color="primary" />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Assets
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your transactional accounts and manual assets
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardActionArea onClick={() => navigate('/settings/categories')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CategoryIcon fontSize="large" color="primary" />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Categories
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Organize your transaction types and categories
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardActionArea onClick={() => navigate('/settings/data-sync')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SyncIcon fontSize="large" color="primary" />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Data & Sync
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your data file and sync preferences
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
