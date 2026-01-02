import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualAssetsPage } from './ManualAssetsPage';
import { useAssetStore } from '../../stores/useAssetStore';
import { AssetType } from '../../types/enums';

jest.mock('../../stores/useAssetStore');

describe('ManualAssetsPage', () => {
  const mockDeleteManualAsset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAssetStore as unknown as jest.Mock).mockReturnValue({
      manualAssets: [],
      deleteManualAsset: mockDeleteManualAsset,
    });
  });

  it('should render page title', () => {
    render(<ManualAssetsPage />);

    expect(screen.getByText('Manual Assets')).toBeInTheDocument();
  });

  it('should render add asset button', () => {
    render(<ManualAssetsPage />);

    expect(screen.getByText('Add Asset')).toBeInTheDocument();
  });

  it('should open dialog when add button is clicked', () => {
    render(<ManualAssetsPage />);

    const addButton = screen.getByText('Add Asset');
    fireEvent.click(addButton);

    expect(screen.getByText('Add Manual Asset')).toBeInTheDocument();
  });

  it('should display assets from store', () => {
    (useAssetStore as unknown as jest.Mock).mockReturnValue({
      manualAssets: [
        {
          id: 'asset-1',
          name: 'House',
          type: AssetType.REAL_ESTATE,
          value: 500000,
          currencyId: 'usd',
          date: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      deleteManualAsset: mockDeleteManualAsset,
    });

    render(<ManualAssetsPage />);

    expect(screen.getByText('House')).toBeInTheDocument();
  });

  it('should open edit dialog when edit is clicked', () => {
    (useAssetStore as unknown as jest.Mock).mockReturnValue({
      manualAssets: [
        {
          id: 'asset-1',
          name: 'House',
          type: AssetType.REAL_ESTATE,
          value: 500000,
          currencyId: 'usd',
          date: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      deleteManualAsset: mockDeleteManualAsset,
    });

    render(<ManualAssetsPage />);

    const editButton = screen.getByLabelText('Edit asset');
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Asset')).toBeInTheDocument();
  });

  it('should show delete confirmation dialog', () => {
    (useAssetStore as unknown as jest.Mock).mockReturnValue({
      manualAssets: [
        {
          id: 'asset-1',
          name: 'House',
          type: AssetType.REAL_ESTATE,
          value: 500000,
          currencyId: 'usd',
          date: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      deleteManualAsset: mockDeleteManualAsset,
    });

    render(<ManualAssetsPage />);

    const deleteButton = screen.getByLabelText('Delete asset');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Asset')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "House"/)).toBeInTheDocument();
  });

  it('should delete asset when confirmed', async () => {
    (useAssetStore as unknown as jest.Mock).mockReturnValue({
      manualAssets: [
        {
          id: 'asset-1',
          name: 'House',
          type: AssetType.REAL_ESTATE,
          value: 500000,
          currencyId: 'usd',
          date: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      deleteManualAsset: mockDeleteManualAsset,
    });

    render(<ManualAssetsPage />);

    const deleteButton = screen.getByLabelText('Delete asset');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteManualAsset).toHaveBeenCalledWith('asset-1');
    });
  });

  it('should cancel delete when cancel is clicked', async () => {
    (useAssetStore as unknown as jest.Mock).mockReturnValue({
      manualAssets: [
        {
          id: 'asset-1',
          name: 'House',
          type: AssetType.REAL_ESTATE,
          value: 500000,
          currencyId: 'usd',
          date: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      deleteManualAsset: mockDeleteManualAsset,
    });

    render(<ManualAssetsPage />);

    const deleteButton = screen.getByLabelText('Delete asset');
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockDeleteManualAsset).not.toHaveBeenCalled();
      expect(screen.queryByText('Delete Asset')).not.toBeInTheDocument();
    });
  });
});
