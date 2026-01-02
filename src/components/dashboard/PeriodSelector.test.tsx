import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PeriodSelector } from './PeriodSelector';
import type { PeriodOption } from './PeriodSelector';

describe('PeriodSelector', () => {
  const mockOnChange = jest.fn();
  const defaultValue: PeriodOption = {
    label: 'This Month',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default value', () => {
    render(<PeriodSelector value={defaultValue} onChange={mockOnChange} />);
    expect(screen.getByLabelText(/period/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('This Month');
  });

  it('displays all period options', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value={defaultValue} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    await user.click(select);

    expect(screen.getByRole('option', { name: 'This Month' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Last Month' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'This Quarter' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'This Year' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Year to Date' })).toBeInTheDocument();
  });

  it('calls onChange when period is selected', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value={defaultValue} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    await user.click(select);
    await user.click(screen.getByRole('option', { name: 'Last Month' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Last Month',
        startDate: expect.any(String),
        endDate: expect.any(String),
      })
    );
  });

  it('returns correct date range for "This Year"', async () => {
    const user = userEvent.setup();
    render(<PeriodSelector value={defaultValue} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    await user.click(select);
    await user.click(screen.getByRole('option', { name: 'This Year' }));

    const call = mockOnChange.mock.calls[0][0];
    expect(call.startDate).toMatch(/^\d{4}-01-01$/);
    expect(call.endDate).toMatch(/^\d{4}-12-31$/);
  });
});
