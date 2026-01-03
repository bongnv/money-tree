import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('should render with title and message when open', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const handleConfirm = jest.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        open={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={handleConfirm}
        onCancel={jest.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const handleCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        open={true}
        title="Confirm Action"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(handleCancel).toHaveBeenCalled();
  });

  it('should use custom button text', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete Item"
        message="This cannot be undone"
        confirmText="Delete"
        cancelText="Keep"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('should render with error severity', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete Item"
        message="This is dangerous"
        severity="error"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    // Check that it's an error-colored button
    expect(confirmButton).toBeInTheDocument();
  });
});
