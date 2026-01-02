import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface BarChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface BarChartProps {
  data: BarChartDataPoint[];
  bars: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  stacked?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  formatValue,
  stacked = false,
}) => {
  const theme = useTheme();

  const formatTooltip = (value: number | undefined): string => {
    if (value === undefined) return '';
    return formatValue ? formatValue(value) : value.toLocaleString();
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey={xAxisKey}
            style={{ fontSize: '0.875rem' }}
          />
          <YAxis
            style={{ fontSize: '0.875rem' }}
            tickFormatter={formatValue}
          />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
          />
          {showLegend && <Legend />}
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color || theme.palette.primary.main}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </Box>
  );
};
