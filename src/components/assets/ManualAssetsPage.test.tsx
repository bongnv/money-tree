/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualAssetsPage } from './ManualAssetsPage';
import { useStore } from '@/contexts/StoreContext';
import { useAssetDialog } from '@/hooks/assets/useAssetDialog';
import type { ManualAsset } from '../../types/models';
import { CurrencyCode } from '../../types/enums';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/ServiceContext');
jest.mock('@/hooks/assets/useAssetDialog');

jest.mock('./ManualAssetList', () => ({
  ManualAssetList: ({ assets, onEdit, onDelete, onUpdateValue }: any) => (
    <div data-testid="asset-list">
      {assets.map((asset: ManualAsset) => (
        <div key={asset.id}>
          <span>{asset.name}</span>
          <button onClick={() => onEdit(asset)}>Edit</button>
          <button onClick={() => onDelete(asset)}>Delete</button>
          <button onClick={() => onUpdateValue(asset)}>Update Value</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('./ManualAssetDialog', () => ({
  ManualAssetDialog: ({ open }: any) =>
    open ? <div data-testid="asset-dialog">Asset Dialog</div> : null,
}));

jest.mock('@/components/common/ConfirmDialog', () => ({
  ConfirmDialog: ({ open, onConfirm, onCancel }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseAssetDialog = useAssetDialog as jest.MockedFunction<typeof useAssetDialog>;

describe('ManualAssetsPage', () => {
  const mockAsset: ManualAsset = {
    id: 'asset-1',
    name: 'Investment Portfolio',
    type: 'investment' as any,
    currencyCode: CurrencyCode.USD,
    valueHistory: [{ date: '2024-01-01', value: 50000 }],
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockAssetDialog = {
    isOpen: false,
    selectedItem: null,
    mode: 'create',
    openCreate: jest.fn(),
    openEdit: jest.fn(),
    openView: jest.fn(),
    close: jest.fn(),
  };

  const mockDeleteAsset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      assets: [mockAsset],
      transactions: [],
      accounts: [],
      budgets: [],
      categories: [],
      transactionTypes: [],
      exchangeRates: [],
      deleteAsset: mockDeleteAsset,
    } as any);
    mockUseAssetDialog.mockReturnValue(mockAssetDialog as any);
  });

  it('should render page title', () => {
    render(<ManualAssetsPage />);
    expect(screen.getByText('Manual Assets')).toBeInTheDocument();
  });

  it('should render add asset button', () => {
    render(<ManualAssetsPage />);
    expect(screen.getByText('Add Asset')).toBeInTheDocument();
  });

  it('should render asset list', () => {
    render(<ManualAssetsPage />);
    expect(screen.getByTestId('asset-list')).toBeInTheDocument();
    expect(screen.getByText('Investment Portfolio')).toBeInTheDocument();
  });

  it('should open create dialog when add asset button is clicked', async () => {
    const user = userEvent.setup();
    render(<ManualAssetsPage />);

    const addButton = screen.getByText('Add Asset');
    await user.click(addButton);

    expect(mockAssetDialog.openCreate).toHaveBeenCalled();
  });

  it('should open edit dialog when edit is clicked', async () => {
    const user = userEvent.setup();
    render(<ManualAssetsPage />);

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    expect(mockAssetDialog.openEdit).toHaveBeenCalledWith(mockAsset);
  });

  it('should open update value dialog when update value is clicked', async () => {
    const user = userEvent.setup();
    render(<ManualAssetsPage />);

    const updateButton = screen.getByText('Update Value');
    await user.click(updateButton);

    expect(mockAssetDialog.openView).toHaveBeenCalledWith(mockAsset);
  });

  it('should show delete confirmation when delete is clicked', async () => {
    const user = userEvent.setup();
    render(<ManualAssetsPage />);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('should delete asset when confirmed', async () => {
    const user = userEvent.setup();
    mockDeleteAsset.mockResolvedValue(undefined);

    render(<ManualAssetsPage />);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteAsset).toHaveBeenCalledWith('asset-1');
    });
  });

  it('should cancel delete when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ManualAssetsPage />);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('should render dialog when isOpen is true', () => {
    mockUseAssetDialog.mockReturnValue({
      ...mockAssetDialog,
      isOpen: true,
    } as any);

    render(<ManualAssetsPage />);
    expect(screen.getByTestId('asset-dialog')).toBeInTheDocument();
  });

  it('should handle empty assets list', () => {
    mockUseStore.mockReturnValue({
      assets: [],
    } as any);
    render(<ManualAssetsPage />);
    expect(screen.getByTestId('asset-list')).toBeInTheDocument();
  });

  it('should handle undefined assets', () => {
    mockUseStore.mockReturnValue({
      assets: undefined,
    } as any);
    render(<ManualAssetsPage />);
    expect(screen.getByTestId('asset-list')).toBeInTheDocument();
  });

  it('should pass correct mode to dialog for update-value', () => {
    mockUseAssetDialog.mockReturnValue({
      ...mockAssetDialog,
      isOpen: true,
      mode: 'view',
    } as any);

    render(<ManualAssetsPage />);
    expect(screen.getByTestId('asset-dialog')).toBeInTheDocument();
  });
});
