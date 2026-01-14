import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Box } from '@mui/material';

export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartDataPoint[];
  height?: number;
  formatter?: (value: number) => string;
  showLegend?: boolean;
}

const DEFAULT_COLORS = [
  '#3f51b5', // Primary blue
  '#f50057', // Secondary pink
  '#4caf50', // Green
  '#ff9800', // Orange
  '#9c27b0', // Purple
  '#00bcd4', // Cyan
  '#ffeb3b', // Yellow
  '#795548', // Brown
  '#607d8b', // Blue grey
  '#e91e63', // Pink
];

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 300,
  formatter,
  showLegend = true,
}) => {
  const formatTooltip = (value: number | undefined): string => {
    if (value === undefined) return '';
    return formatter ? formatter(value) : value.toString();
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={formatTooltip} />
          {showLegend && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </Box>
  );
};
