import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountCard } from './AccountCard';
import { AccountType } from '../../types/enums';
import type { Account } from '../../types/models';

describe('AccountCard', () => {
  const mockAccount: Account = {
    id: 'acc-1',
    name: 'Checking Account',
    type: AccountType.BANK_ACCOUNT,
    currencyId: 'usd',
    initialBalance: 1000,
    description: 'My main checking account',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render account information', () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Checking Account')).toBeInTheDocument();
    expect(screen.getByText('$1000.00')).toBeInTheDocument();
    expect(screen.getByText('My main checking account')).toBeInTheDocument();
    expect(screen.getByText('BANK ACCOUNT')).toBeInTheDocument();
  });

  it('should render without description', () => {
    const accountWithoutDescription = { ...mockAccount, description: undefined };
    render(
      <AccountCard
        account={accountWithoutDescription}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Checking Account')).toBeInTheDocument();
    expect(screen.queryByText('My main checking account')).not.toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByLabelText('Edit Checking Account');
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockAccount);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete Checking Account');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockAccount);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should show inactive status', () => {
    const inactiveAccount = { ...mockAccount, isActive: false };
    render(
      <AccountCard
        account={inactiveAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('BANK ACCOUNT')).toBeInTheDocument();
  });
});
