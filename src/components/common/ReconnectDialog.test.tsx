import { render, screen, fireEvent } from '@testing-library/react';
import ReconnectDialog from './ReconnectDialog';

describe('ReconnectDialog', () => {
  const mockOnReconnect = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <ReconnectDialog
        open={true}
        providerName="OneDrive"
        onReconnect={mockOnReconnect}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Session Expired')).toBeInTheDocument();
    expect(screen.getByText(/Your OneDrive session has expired/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <ReconnectDialog
        open={false}
        providerName="OneDrive"
        onReconnect={mockOnReconnect}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.queryByText('Session Expired')).not.toBeInTheDocument();
  });

  it('should call onReconnect when Reconnect button is clicked', () => {
    render(
      <ReconnectDialog
        open={true}
        providerName="OneDrive"
        onReconnect={mockOnReconnect}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByText(/Reconnect to OneDrive/i));
    expect(mockOnReconnect).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when Choose Storage button is clicked', () => {
    render(
      <ReconnectDialog
        open={true}
        providerName="OneDrive"
        onReconnect={mockOnReconnect}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.click(screen.getByText(/Choose Storage/i));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should display correct provider name', () => {
    render(
      <ReconnectDialog
        open={true}
        providerName="Google Drive"
        onReconnect={mockOnReconnect}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText(/Your Google Drive session has expired/i)).toBeInTheDocument();
    expect(screen.getByText(/Reconnect to Google Drive/i)).toBeInTheDocument();
  });
});
