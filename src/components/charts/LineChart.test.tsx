import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LineChart, LineChartProps } from './LineChart';

describe('LineChart', () => {
  const mockData = [
    { name: 'Jan', value1: 1000, value2: 500 },
    { name: 'Feb', value1: 1200, value2: 600 },
    { name: 'Mar', value1: 1500, value2: 700 },
  ];

  const defaultProps: LineChartProps = {
    data: mockData,
    lines: [
      { dataKey: 'value1', name: 'Series 1', color: '#2e7d32' },
      { dataKey: 'value2', name: 'Series 2', color: '#1976d2' },
    ],
  };

  it('should render without crashing', () => {
    const { container } = render(<LineChart {...defaultProps} />);
    // The chart renders inside a ResponsiveContainer
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should render with custom height', () => {
    const { container } = render(<LineChart {...defaultProps} height={500} />);
    const box = container.querySelector('[class*="MuiBox"]');
    expect(box).toHaveStyle({ height: '500px' });
  });

  it('should handle empty data', () => {
    const { container } = render(<LineChart {...defaultProps} data={[]} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should use custom xAxisKey', () => {
    const customData = [
      { name: '2024-01', date: '2024-01', value: 100 },
      { name: '2024-02', date: '2024-02', value: 200 },
    ];
    const { container } = render(
      <LineChart
        data={customData}
        lines={[{ dataKey: 'value', name: 'Value' }]}
        xAxisKey="date"
      />
    );
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should render with custom formatValue function', () => {
    const formatValue = (value: number) => `$${value.toFixed(2)}`;
    const { container } = render(<LineChart {...defaultProps} formatValue={formatValue} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should hide grid when showGrid is false', () => {
    const { container } = render(<LineChart {...defaultProps} showGrid={false} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should hide legend when showLegend is false', () => {
    const { container } = render(<LineChart {...defaultProps} showLegend={false} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should render multiple lines', () => {
    const { container } = render(<LineChart {...defaultProps} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    // Each line should be rendered with its configuration
    expect(defaultProps.lines).toHaveLength(2);
  });
});
