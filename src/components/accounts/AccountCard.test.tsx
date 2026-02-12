/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, fireEvent } from '@testing-library/react';
import { AccountCard } from './AccountCard';
import { useStore } from '@/contexts/StoreContext';
import { useCalculationService } from '@/contexts/ServiceContext';
import { CurrencyCode } from '@/types/enums';
import type { Account } from '@/types/models';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseCalcService = useCalculationService as jest.MockedFunction<
  typeof useCalculationService
>;

describe('AccountCard', () => {
  const mockAccount: Account = {
    id: 'acc-1',
    name: 'Checking',
    type: 'bank_account' as any,
    currencyCode: CurrencyCode.USD,
    initialBalance: 1000,
    isActive: true,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onArchive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({ transactions: [] } as any);
    mockUseCalcService.mockReturnValue({
      calculateAccountBalance: jest.fn().mockReturnValue(1500),
    } as any);
  });

  it('should render account name and balance', () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
      />
    );

    expect(screen.getByText('Checking')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
      />
    );

    fireEvent.click(screen.getByLabelText('Edit Checking'));
    expect(onEdit).toHaveBeenCalledWith(mockAccount);
  });

  it('should call onDelete when delete button clicked', () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete Checking'));
    expect(onDelete).toHaveBeenCalledWith(mockAccount);
  });

  it('should call onArchive when archive button clicked', () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
      />
    );

    fireEvent.click(screen.getByLabelText('Archive Checking'));
    expect(onArchive).toHaveBeenCalledWith(mockAccount);
  });

  it('should show Archived chip for inactive accounts', () => {
    const inactiveAccount = { ...mockAccount, isActive: false };

    render(
      <AccountCard
        account={inactiveAccount}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
      />
    );

    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(screen.getByLabelText('Unarchive Checking')).toBeInTheDocument();
  });

  it('should show description when present', () => {
    const accountWithDesc = { ...mockAccount, description: 'Main checking account' };

    render(
      <AccountCard
        account={accountWithDesc}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
      />
    );

    expect(screen.getByText('Main checking account')).toBeInTheDocument();
  });
});
