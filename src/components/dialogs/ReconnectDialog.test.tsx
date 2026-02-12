/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent } from '@testing-library/react';
import { ReconnectDialog } from './ReconnectDialog';

describe('ReconnectDialog', () => {
  const mockCloudService = {
    getProviderName: jest.fn().mockReturnValue('OneDrive'),
  } as any;

  const onReconnect = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with session expired message', () => {
    render(
      <ReconnectDialog
        cloudService={mockCloudService}
        fileName="money-tree.json"
        error={null}
        onReconnect={onReconnect}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Session Expired')).toBeInTheDocument();
    expect(screen.getByText(/OneDrive session has expired/)).toBeInTheDocument();
    expect(screen.getByText('money-tree.json')).toBeInTheDocument();
  });

  it('should show error when provided', () => {
    render(
      <ReconnectDialog
        cloudService={mockCloudService}
        fileName="test.json"
        error="Connection failed"
        onReconnect={onReconnect}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('should call onReconnect when Reconnect clicked', () => {
    render(
      <ReconnectDialog
        cloudService={mockCloudService}
        fileName="test.json"
        error={null}
        onReconnect={onReconnect}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Reconnect'));
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Work Offline clicked', () => {
    render(
      <ReconnectDialog
        cloudService={mockCloudService}
        fileName="test.json"
        error={null}
        onReconnect={onReconnect}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Work Offline'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should use "Cloud" as fallback provider name', () => {
    const noProviderService = { getProviderName: jest.fn().mockReturnValue(null) } as any;

    render(
      <ReconnectDialog
        cloudService={noProviderService}
        fileName="test.json"
        error={null}
        onReconnect={onReconnect}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText(/Cloud session has expired/)).toBeInTheDocument();
  });
});
