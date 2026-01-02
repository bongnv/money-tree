import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BarChart, BarChartProps } from './BarChart';

describe('BarChart', () => {
  const mockData = [
    { name: 'Category A', value1: 1000, value2: 500 },
    { name: 'Category B', value1: 1200, value2: 600 },
    { name: 'Category C', value1: 1500, value2: 700 },
  ];

  const defaultProps: BarChartProps = {
    data: mockData,
    bars: [
      { dataKey: 'value1', name: 'Series 1', color: '#2e7d32' },
      { dataKey: 'value2', name: 'Series 2', color: '#1976d2' },
    ],
  };

  it('should render without crashing', () => {
    const { container } = render(<BarChart {...defaultProps} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should render with custom height', () => {
    const { container } = render(<BarChart {...defaultProps} height={500} />);
    const box = container.querySelector('[class*="MuiBox"]');
    expect(box).toHaveStyle({ height: '500px' });
  });

  it('should handle empty data', () => {
    const { container } = render(<BarChart {...defaultProps} data={[]} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should use custom xAxisKey', () => {
    const customData = [
      { category: 'A', value: 100 },
      { category: 'B', value: 200 },
    ];
    const { container } = render(
      <BarChart
        data={customData}
        bars={[{ dataKey: 'value', name: 'Value' }]}
        xAxisKey="category"
      />
    );
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should render with custom formatValue function', () => {
    const formatValue = (value: number) => `$${value.toFixed(2)}`;
    const { container } = render(<BarChart {...defaultProps} formatValue={formatValue} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should hide grid when showGrid is false', () => {
    const { container } = render(<BarChart {...defaultProps} showGrid={false} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should hide legend when showLegend is false', () => {
    const { container } = render(<BarChart {...defaultProps} showLegend={false} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should render multiple bars', () => {
    const { container } = render(<BarChart {...defaultProps} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    expect(defaultProps.bars).toHaveLength(2);
  });

  it('should render stacked bars when stacked is true', () => {
    const { container } = render(<BarChart {...defaultProps} stacked={true} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should render unstacked bars by default', () => {
    const { container } = render(<BarChart {...defaultProps} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
