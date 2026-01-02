import React from 'react';
import { render } from '@testing-library/react';
import { PieChart } from './PieChart';

// Mock recharts
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div className="recharts-wrapper">{children}</div>,
  Pie: () => <div className="recharts-pie" />,
  Cell: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Legend: () => <div className="recharts-legend-wrapper" />,
  Tooltip: () => <div />,
}));

describe('PieChart', () => {
  const mockData = [
    { name: 'Category A', value: 100 },
    { name: 'Category B', value: 200 },
    { name: 'Category C', value: 150 },
  ];

  it('should render without crashing', () => {
    const { container } = render(<PieChart data={mockData} />);
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should render with custom height', () => {
    const { container } = render(<PieChart data={mockData} height={400} />);
    // Just verify component renders without crashing
    expect(container).toBeTruthy();
  });

  it('should use custom colors when provided', () => {
    const dataWithColors = [
      { name: 'Red', value: 100, color: '#ff0000' },
      { name: 'Blue', value: 200, color: '#0000ff' },
    ];
    const { container } = render(<PieChart data={dataWithColors} />);
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    const { container } = render(<PieChart data={[]} />);
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should hide legend when showLegend is false', () => {
    const { container } = render(<PieChart data={mockData} showLegend={false} />);
    expect(container.querySelector('.recharts-legend-wrapper')).not.toBeInTheDocument();
  });

  it('should show legend by default', () => {
    const { container } = render(<PieChart data={mockData} />);
    expect(container.querySelector('.recharts-legend-wrapper')).toBeInTheDocument();
  });

  it('should accept custom formatter', () => {
    const formatter = (value: number) => `$${value}`;
    const { container } = render(<PieChart data={mockData} formatter={formatter} />);
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});
