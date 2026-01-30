import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PeriodSelector } from './PeriodSelector';

describe('PeriodSelector', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default Presets', () => {
    it('renders with default presets', () => {
      render(<PeriodSelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('shows all default preset options', () => {
      render(<PeriodSelector {...defaultProps} />);

      fireEvent.mouseDown(screen.getByRole('combobox'));

      expect(screen.getAllByText('This Month').length).toBeGreaterThan(0);
      expect(screen.getByText('Last Month')).toBeInTheDocument();
      expect(screen.getByText('This Quarter')).toBeInTheDocument();
      expect(screen.getByText('Last Quarter')).toBeInTheDocument();
      expect(screen.getByText('Year to Date')).toBeInTheDocument();
      expect(screen.getByText('This Year')).toBeInTheDocument();
      expect(screen.getByText('Last Year')).toBeInTheDocument();
      expect(screen.getByText('Custom Range...')).toBeInTheDocument();
    });

    it('calls onChange when preset is selected', () => {
      render(<PeriodSelector {...defaultProps} />);

      fireEvent.mouseDown(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('This Year'));

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: expect.stringMatching(/^\d{4}-01-01$/),
        endDate: expect.stringMatching(/^\d{4}-12-31$/),
      });
    });
  });

  describe('Custom Presets', () => {
    it('uses custom presets when provided', () => {
      const customPresets = [
        { label: 'Custom 1', value: 'c1', startDate: '2026-01-01', endDate: '2026-01-15' },
        { label: 'Custom 2', value: 'c2', startDate: '2026-02-01', endDate: '2026-02-15' },
      ];

      render(<PeriodSelector {...defaultProps} presets={customPresets} />);

      fireEvent.mouseDown(screen.getByRole('combobox'));

      expect(screen.getByText('Custom 1')).toBeInTheDocument();
      expect(screen.getByText('Custom 2')).toBeInTheDocument();
      expect(screen.queryByText('This Month')).not.toBeInTheDocument();
    });
  });

  describe('Custom Date Range', () => {
    it('opens custom date dialog when Custom Range is selected', async () => {
      render(<PeriodSelector {...defaultProps} />);

      fireEvent.mouseDown(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('Custom Range...'));

      await waitFor(() => {
        expect(screen.getByText('Select Custom Date Range')).toBeInTheDocument();
      });
    });

    it('closes custom date dialog when Cancel is clicked', async () => {
      render(<PeriodSelector {...defaultProps} />);

      fireEvent.mouseDown(screen.getByRole('combobox'));
      fireEvent.click(screen.getByText('Custom Range...'));

      await waitFor(() => {
        expect(screen.getByText('Select Custom Date Range')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Select Custom Date Range')).not.toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('displays custom date range in compact format', () => {
      render(
        <PeriodSelector startDate="2026-03-15" endDate="2026-04-20" onChange={mockOnChange} />
      );

      // Should display as "03/15 - 04/20" in the select display
      expect(screen.getByText('03/15 - 04/20')).toBeInTheDocument();
    });
  });

  describe('Custom Range Control', () => {
    it('hides custom range option when allowCustom is false', () => {
      render(<PeriodSelector {...defaultProps} allowCustom={false} />);

      fireEvent.mouseDown(screen.getByRole('combobox'));

      expect(screen.queryByText('Custom Range...')).not.toBeInTheDocument();
    });

    it('shows custom range option by default', () => {
      render(<PeriodSelector {...defaultProps} />);

      fireEvent.mouseDown(screen.getByRole('combobox'));

      expect(screen.getByText('Custom Range...')).toBeInTheDocument();
    });
  });

  describe('Props Support', () => {
    it('supports size prop', () => {
      const { container } = render(<PeriodSelector {...defaultProps} size="small" />);

      const select = container.querySelector('.MuiSelect-select');
      expect(select).toBeInTheDocument();
    });

    it('supports fullWidth prop', () => {
      const { container } = render(<PeriodSelector {...defaultProps} fullWidth />);

      const formControl = container.querySelector('.MuiFormControl-root');
      expect(formControl).toHaveClass('MuiFormControl-fullWidth');
    });

    it('supports custom label', () => {
      render(<PeriodSelector {...defaultProps} label="Select Period" />);

      expect(screen.getByLabelText('Select Period')).toBeInTheDocument();
    });

    it('supports sx prop', () => {
      const { container } = render(<PeriodSelector {...defaultProps} sx={{ minWidth: 200 }} />);

      const formControl = container.querySelector('.MuiFormControl-root');
      expect(formControl).toBeInTheDocument();
    });
  });

  describe('Preset Matching', () => {
    it('selects correct preset when dates match', () => {
      const currentYear = new Date().getFullYear();
      render(
        <PeriodSelector
          startDate={`${currentYear}-01-01`}
          endDate={`${currentYear}-12-31`}
          onChange={mockOnChange}
        />
      );

      // Should display "This Year" not custom
      expect(screen.getByText('This Year')).toBeInTheDocument();
    });

    it('shows custom when dates do not match any preset', () => {
      render(
        <PeriodSelector startDate="2026-05-15" endDate="2026-06-20" onChange={mockOnChange} />
      );

      // Should display custom format "05/15 - 06/20"
      expect(screen.getByText('05/15 - 06/20')).toBeInTheDocument();
    });
  });
});
