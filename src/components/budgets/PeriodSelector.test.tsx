import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PeriodSelector } from './PeriodSelector';

describe('PeriodSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default current month', () => {
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    const select = screen.getByLabelText('Period');
    expect(select).toBeInTheDocument();
  });

  it('should render with provided value', () => {
    render(<PeriodSelector value="January 2026" onChange={mockOnChange} />);

    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('should call onChange when a month is selected', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="January 2026" onChange={mockOnChange} />);

    // Click the select to open dropdown
    await user.click(screen.getByLabelText('Period'));

    // Select February
    await user.click(screen.getByText('February 2026'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'February 2026',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });
  });

  it('should call onChange when a quarter is selected', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="January 2026" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));
    await user.click(screen.getByText('Q1 2026'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'Q1 2026',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });
  });

  it('should call onChange when a year is selected', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="January 2026" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));
    await user.click(screen.getByText('2026'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: '2026',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
  });

  it('should display all 12 months', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));

    // Use getAllByText and check length for months that appear in the dropdown
    expect(screen.getAllByText('January 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('February 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('March 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('April 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('May 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('June 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('July 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('August 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('September 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('October 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('November 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText('December 2026')[0]).toBeInTheDocument();
  });

  it('should display all 4 quarters', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));

    expect(screen.getByText('Q1 2026')).toBeInTheDocument();
    expect(screen.getByText('Q2 2026')).toBeInTheDocument();
    expect(screen.getByText('Q3 2026')).toBeInTheDocument();
    expect(screen.getByText('Q4 2026')).toBeInTheDocument();
  });

  it('should display current and previous year options', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));

    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  it('should have correct date ranges for Q2', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));
    await user.click(screen.getByText('Q2 2026'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'Q2 2026',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
    });
  });

  it('should have correct date ranges for Q3', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));
    await user.click(screen.getByText('Q3 2026'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'Q3 2026',
      startDate: '2026-07-01',
      endDate: '2026-09-30',
    });
  });

  it('should have correct date ranges for Q4', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));
    await user.click(screen.getByText('Q4 2026'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'Q4 2026',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
    });
  });

  it('should have correct date range for previous year', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));
    await user.click(screen.getByText('2025'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: '2025',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });
  });

  it('should handle February with correct last day', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));
    await user.click(screen.getByText('February 2026'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'February 2026',
      startDate: '2026-02-01',
      endDate: '2026-02-28', // 2026 is not a leap year
    });
  });

  it('should handle month with 30 days', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));
    await user.click(screen.getByText('April 2026'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'April 2026',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
    });
  });

  it('should handle month with 31 days', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value="" onChange={mockOnChange} />);

    await user.click(screen.getByLabelText('Period'));
    await user.click(screen.getByText('March 2026'));

    expect(mockOnChange).toHaveBeenCalledWith({
      label: 'March 2026',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    });
  });
});
