import React, { useState } from 'react';
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
  IconButton,
  Collapse,
  Button,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { AssetGroup } from '../../services/report.service';
import { formatCurrency } from '../../utils/currency.utils';
import { LineChart } from '../charts/LineChart';
import { useAssetStore } from '../../stores/useAssetStore';
import { getCompleteValueHistory, calculateAssetValueGrowth } from '../../services/history.service';

export interface ManualAssetSectionProps {
  title: string;
  groups: AssetGroup[];
  currencyId: string;
  onManageHistory?: (assetId: string) => void;
}

type DateRange = '3m' | '6m' | '1y' | 'all';

export const ManualAssetSection: React.FC<ManualAssetSectionProps> = ({
  title,
  groups,
  currencyId,
  onManageHistory,
}) => {
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('1y');
  const manualAssets = useAssetStore((state) => state.manualAssets);

  const total = groups.reduce((sum, group) => sum + group.total, 0);

  if (groups.length === 0) {
    return null;
  }

  const handleToggleExpand = (assetId: string) => {
    setExpandedAssetId(expandedAssetId === assetId ? null : assetId);
  };

  const handleDateRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRange: DateRange | null
  ) => {
    if (newRange !== null) {
      setDateRange(newRange);
    }
  };

  const getFilteredChartData = (assetId: string) => {
    const asset = manualAssets.find((a) => a.id === assetId);
    if (!asset) return [];

    const completeHistory = getCompleteValueHistory(asset);
    if (completeHistory.length === 0) return [];

    // Calculate cutoff date based on range
    const today = new Date();
    let cutoffDate: Date;

    switch (dateRange) {
      case '3m':
        cutoffDate = new Date(today.setMonth(today.getMonth() - 3));
        break;
      case '6m':
        cutoffDate = new Date(today.setMonth(today.getMonth() - 6));
        break;
      case '1y':
        cutoffDate = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      case 'all':
      default:
        return completeHistory.map((entry) => ({
          name: new Date(entry.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          Value: entry.value,
        }));
    }

    const filtered = completeHistory.filter((entry) => new Date(entry.date) >= cutoffDate);
    return filtered.map((entry) => ({
      name: new Date(entry.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      Value: entry.value,
    }));
  };

  const getGrowthInfo = (assetId: string) => {
    const asset = manualAssets.find((a) => a.id === assetId);
    if (!asset) return null;

    const completeHistory = getCompleteValueHistory(asset);
    if (completeHistory.length < 2) return null;

    const growth = calculateAssetValueGrowth(asset);
    return growth;
  };

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
              <TableCell width="50px"></TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <React.Fragment key={group.name}>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell></TableCell>
                  <TableCell colSpan={3}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {group.name}
                    </Typography>
                  </TableCell>
                </TableRow>
                {group.items.map((item) => {
                  const isExpanded = expandedAssetId === item.id;
                  const growthInfo = getGrowthInfo(item.id);
                  const hasHistory = growthInfo !== null;

                  return (
                    <React.Fragment key={item.id}>
                      <TableRow
                        hover
                        sx={{
                          cursor: hasHistory ? 'pointer' : 'default',
                          backgroundColor: isExpanded ? 'action.selected' : undefined,
                        }}
                        onClick={() => hasHistory && handleToggleExpand(item.id)}
                      >
                        <TableCell>
                          {hasHistory && (
                            <IconButton size="small">
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.name}
                            {hasHistory && growthInfo && (
                              <Chip
                                size="small"
                                icon={
                                  growthInfo.percentageChange >= 0 ? (
                                    <TrendingUpIcon />
                                  ) : (
                                    <TrendingDownIcon />
                                  )
                                }
                                label={`${growthInfo.percentageChange >= 0 ? '+' : ''}${growthInfo.percentageChange.toFixed(1)}%`}
                                color={growthInfo.percentageChange >= 0 ? 'success' : 'error'}
                                sx={{ height: '20px' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.value, currencyId)}
                        </TableCell>
                      </TableRow>
                      {hasHistory && (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ p: 0, border: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 3, backgroundColor: 'background.default' }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2,
                                  }}
                                >
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    Value History
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <ToggleButtonGroup
                                      value={dateRange}
                                      exclusive
                                      onChange={handleDateRangeChange}
                                      size="small"
                                    >
                                      <ToggleButton value="3m">3M</ToggleButton>
                                      <ToggleButton value="6m">6M</ToggleButton>
                                      <ToggleButton value="1y">1Y</ToggleButton>
                                      <ToggleButton value="all">All</ToggleButton>
                                    </ToggleButtonGroup>
                                    {onManageHistory && (
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onManageHistory(item.id);
                                        }}
                                      >
                                        Manage History
                                      </Button>
                                    )}
                                  </Box>
                                </Box>
                                <LineChart
                                  data={getFilteredChartData(item.id)}
                                  lines={[{ dataKey: 'Value', name: 'Value', color: '#1976d2' }]}
                                  height={250}
                                  formatValue={(value) => formatCurrency(value, currencyId)}
                                />
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
                <TableRow>
                  <TableCell></TableCell>
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
              <TableCell></TableCell>
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
