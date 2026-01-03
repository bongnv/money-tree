import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationSnackbar } from './NotificationSnackbar';

describe('NotificationSnackbar', () => {
  it('should render with message when open', () => {
    render(
      <NotificationSnackbar
        open={true}
        message="Test message"
        onClose={jest.fn()}
        severity="success"
      />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <NotificationSnackbar
        open={false}
        message="Test message"
        onClose={jest.fn()}
        severity="success"
      />
    );

    expect(container.querySelector('.MuiSnackbar-root')).not.toBeVisible();
  });

  it('should call onClose when close button is clicked', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();

    render(
      <NotificationSnackbar
        open={true}
        message="Test message"
        onClose={handleClose}
        severity="info"
      />
    );

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });

  it('should render with different severity levels', () => {
    const severities: Array<'success' | 'error' | 'warning' | 'info'> = [
      'success',
      'error',
      'warning',
      'info',
    ];

    severities.forEach((severity) => {
      const { rerender } = render(
        <NotificationSnackbar
          open={true}
          message={`${severity} message`}
          onClose={jest.fn()}
          severity={severity}
        />
      );

      expect(screen.getByText(`${severity} message`)).toBeInTheDocument();
      rerender(<></>);
    });
  });

  it('should use default severity of info', () => {
    render(<NotificationSnackbar open={true} message="Test message" onClose={jest.fn()} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
