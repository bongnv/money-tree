import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualAssetsPage } from './ManualAssetsPage';
import { useAssets } from '../../hooks/queries/useAssets';
import { assetService } from '../../services/asset.service';
import { AssetType } from '../../types/enums';

jest.mock('../../hooks/queries/useAssets');
jest.mock('../../services/asset.service');

describe('ManualAssetsPage', () => {
  const mockDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAssets as jest.Mock).mockReturnValue([]);
    (assetService.delete as jest.Mock) = mockDelete;
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
    (useAssets as jest.Mock).mockReturnValue([
      {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [{ date: '2024-01-15', value: 500000 }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    render(<ManualAssetsPage />);

    expect(screen.getByText('House')).toBeInTheDocument();
  });

  it('should open edit dialog when edit is clicked', () => {
    (useAssets as jest.Mock).mockReturnValue([
      {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [{ date: '2024-01-15', value: 500000 }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    render(<ManualAssetsPage />);

    const editButton = screen.getByLabelText('Edit asset');
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Asset')).toBeInTheDocument();
  });

  it('should show delete confirmation dialog', () => {
    (useAssets as jest.Mock).mockReturnValue([
      {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [{ date: '2024-01-15', value: 500000 }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    render(<ManualAssetsPage />);

    const deleteButton = screen.getByLabelText('Delete asset');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Asset')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "House"/)).toBeInTheDocument();
  });

  it('should delete asset when confirmed', async () => {
    (useAssets as jest.Mock).mockReturnValue([
      {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [{ date: '2024-01-15', value: 500000 }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    render(<ManualAssetsPage />);

    const deleteButton = screen.getByLabelText('Delete asset');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('asset-1');
    });
  });

  it('should cancel delete when cancel is clicked', async () => {
    (useAssets as jest.Mock).mockReturnValue([
      {
        id: 'asset-1',
        name: 'House',
        type: AssetType.REAL_ESTATE,
        currencyCode: 'USD',
        valueHistory: [{ date: '2024-01-15', value: 500000 }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    render(<ManualAssetsPage />);

    const deleteButton = screen.getByLabelText('Delete asset');
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockDelete).not.toHaveBeenCalled();
      expect(screen.queryByText('Delete Asset')).not.toBeInTheDocument();
    });
  });
});
