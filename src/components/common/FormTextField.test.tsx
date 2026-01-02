import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormTextField } from './FormTextField';

describe('FormTextField', () => {
  it('should render with label', () => {
    render(<FormTextField label="Test Field" />);
    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
  });

  it('should render with value', () => {
    render(<FormTextField label="Test Field" value="Test Value" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument();
  });

  it('should show error message', () => {
    render(<FormTextField label="Test Field" error helperText="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should call onChange when value changes', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<FormTextField label="Test Field" onChange={handleChange} />);

    const input = screen.getByLabelText('Test Field');
    await user.type(input, 'test');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FormTextField label="Test Field" disabled />);
    expect(screen.getByLabelText('Test Field')).toBeDisabled();
  });

  it('should be required when required prop is true', () => {
    render(<FormTextField label="Test Field" required />);
    const input = screen.getByLabelText('Test Field *');
    expect(input).toBeRequired();
  });

  it('should render multiline textarea', () => {
    render(<FormTextField label="Test Field" multiline rows={4} />);
    const textarea = screen.getByLabelText('Test Field');
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('should apply fullWidth and margin="normal" by default', () => {
    const { container } = render(<FormTextField label="Test Field" />);
    const textField = container.querySelector('.MuiTextField-root');
    expect(textField).toHaveClass('MuiFormControl-fullWidth');
    expect(textField).toHaveClass('MuiFormControl-marginNormal');
  });

  it('should accept custom props', () => {
    render(<FormTextField label="Test Field" placeholder="Enter text" type="email" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render select variant', () => {
    render(
      <FormTextField label="Test Field" select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </FormTextField>
    );
    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
  });
});
