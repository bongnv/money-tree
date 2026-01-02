import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { AssetGroup } from '../../services/report.service';
import { formatCurrency } from '../../utils/currency.utils';

export interface ManualAssetSectionProps {
  title: string;
  groups: AssetGroup[];
  currencyId: string;
}

export const ManualAssetSection: React.FC<ManualAssetSectionProps> = ({
  title,
  groups,
  currencyId,
}) => {
  const total = groups.reduce((sum, group) => sum + group.total, 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <React.Fragment key={group.name}>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell colSpan={3}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {group.name}
                    </Typography>
                  </TableCell>
                </TableRow>
                {group.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell></TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{formatCurrency(item.value, currencyId)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      Subtotal
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(group.total, currencyId)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              <TableCell colSpan={2}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.contrastText">
                  Total {title}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle1" fontWeight="bold" color="primary.contrastText">
                  {formatCurrency(total, currencyId)}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
