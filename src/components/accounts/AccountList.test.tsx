import { render, screen } from '@testing-library/react';
import { AccountList } from './AccountList';
import { AccountType } from '../../types/enums';
import type { Account } from '../../types/models';

describe('AccountList', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Checking Account',
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-2',
      name: 'Savings Account',
      type: AccountType.CASH,
      currencyId: 'usd',
      initialBalance: 5000,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  it('should render all accounts', () => {
    render(
      <AccountList
        accounts={mockAccounts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Checking Account')).toBeInTheDocument();
    expect(screen.getByText('Savings Account')).toBeInTheDocument();
  });

  it('should render empty state when no accounts', () => {
    render(
      <AccountList
        accounts={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(
      screen.getByText(/No accounts yet. Create your first account to get started./i)
    ).toBeInTheDocument();
  });
});
