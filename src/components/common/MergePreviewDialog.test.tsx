import { render, screen, fireEvent } from '@testing-library/react';
import { MergePreviewDialog } from './MergePreviewDialog';
import { Conflict } from '../../services/merge.service';
import { AccountType } from '../../types/enums';

describe('MergePreviewDialog', () => {
  const mockOnCancel = jest.fn();
  const mockOnApply = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createConflict = (id: string, name: string): Conflict => ({
    type: 'account',
    entityId: id,
    entityName: name,
    fileVersion: {
      id,
      name: `${name} (File)`,
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 1000,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
    appVersion: {
      id,
      name: `${name} (App)`,
      type: AccountType.BANK_ACCOUNT,
      currencyId: 'usd',
      initialBalance: 2000,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-03T00:00:00Z',
    },
    conflictReason: 'both-modified',
  });

  it('should render when open', () => {
    const conflicts = [createConflict('1', 'Test Account')];

    render(
      <MergePreviewDialog
        open={true}
        conflicts={conflicts}
        autoMergedCount={0}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('Merge Conflicts Detected')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const conflicts = [createConflict('1', 'Test Account')];

    render(
      <MergePreviewDialog
        open={false}
        conflicts={conflicts}
        autoMergedCount={0}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    expect(screen.queryByText('Merge Conflicts Detected')).not.toBeInTheDocument();
  });

  it('should show auto-merged count when greater than 0', () => {
    const conflicts = [createConflict('1', 'Test Account')];

    render(
      <MergePreviewDialog
        open={true}
        conflicts={conflicts}
        autoMergedCount={5}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('5 changes auto-merged')).toBeInTheDocument();
  });

  it('should display conflict details', () => {
    const conflicts = [createConflict('1', 'Checking Account')];

    render(
      <MergePreviewDialog
        open={true}
        conflicts={conflicts}
        autoMergedCount={0}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('account: Checking Account')).toBeInTheDocument();
    expect(screen.getByText('Modified in both file and app')).toBeInTheDocument();
    expect(screen.getByText('Keep External Changes')).toBeInTheDocument();
    expect(screen.getByText('Keep Your Changes')).toBeInTheDocument();
  });

  it('should call onCancel when Cancel button clicked', () => {
    const conflicts = [createConflict('1', 'Test Account')];

    render(
      <MergePreviewDialog
        open={true}
        conflicts={conflicts}
        autoMergedCount={0}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onApply with resolutions when Apply button clicked', () => {
    const conflicts = [createConflict('1', 'Test Account')];

    render(
      <MergePreviewDialog
        open={true}
        conflicts={conflicts}
        autoMergedCount={0}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    fireEvent.click(screen.getByText('Apply Merge'));

    expect(mockOnApply).toHaveBeenCalledTimes(1);
    expect(mockOnApply).toHaveBeenCalledWith([
      { conflictIndex: 0, resolution: 'app' }, // Default is 'app'
    ]);
  });

  it('should allow selecting file version', () => {
    const conflicts = [createConflict('1', 'Test Account')];

    render(
      <MergePreviewDialog
        open={true}
        conflicts={conflicts}
        autoMergedCount={0}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    // Click the radio button for file version
    const fileRadio = screen.getAllByRole('radio')[0];
    fireEvent.click(fileRadio);

    fireEvent.click(screen.getByText('Apply Merge'));

    expect(mockOnApply).toHaveBeenCalledWith([{ conflictIndex: 0, resolution: 'file' }]);
  });

  it('should handle multiple conflicts', () => {
    const conflicts = [createConflict('1', 'Account 1'), createConflict('2', 'Account 2')];

    render(
      <MergePreviewDialog
        open={true}
        conflicts={conflicts}
        autoMergedCount={0}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('account: Account 1')).toBeInTheDocument();
    expect(screen.getByText('account: Account 2')).toBeInTheDocument();
    expect(screen.getByText('2 conflicts requiring your decision')).toBeInTheDocument();
  });

  it('should show success message when no conflicts', () => {
    render(
      <MergePreviewDialog
        open={true}
        conflicts={[]}
        autoMergedCount={10}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    expect(
      screen.getByText('No conflicts! All changes were merged automatically.')
    ).toBeInTheDocument();
  });

  it('should format deleted entity', () => {
    const conflict: Conflict = {
      type: 'account',
      entityId: '1',
      entityName: 'Deleted Account',
      fileVersion: null,
      appVersion: {
        id: '1',
        name: 'Deleted Account (App)',
        type: AccountType.BANK_ACCOUNT,
        currencyId: 'usd',
        initialBalance: 1000,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      conflictReason: 'delete-modify',
    };

    render(
      <MergePreviewDialog
        open={true}
        conflicts={[conflict]}
        autoMergedCount={0}
        onCancel={mockOnCancel}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('Deleted in file, modified in app')).toBeInTheDocument();
    expect(screen.getByText('(deleted)')).toBeInTheDocument();
  });
});
