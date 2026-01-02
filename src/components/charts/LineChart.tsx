import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface LineChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  lines: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  formatValue,
}) => {
  const theme = useTheme();

  const formatTooltip = (value: number | undefined): string => {
    if (value === undefined) return '';
    return formatValue ? formatValue(value) : value.toLocaleString();
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
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
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || theme.palette.primary.main}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </Box>
  );
};
