import { render, screen } from '@testing-library/react';
import { ManualAssetList } from './ManualAssetList';
import { AssetType } from '../../types/enums';
import type { ManualAsset } from '../../types/models';

describe('ManualAssetList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockAssets: ManualAsset[] = [
    {
      id: 'asset-1',
      name: 'House',
      type: AssetType.REAL_ESTATE,
      value: 500000,
      currencyId: 'usd',
      date: '2024-01-15T00:00:00.000Z',
      notes: 'Primary residence',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'asset-2',
      name: 'Car',
      type: AssetType.OTHER,
      value: 25000,
      currencyId: 'usd',
      date: '2024-01-15T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render list of assets', () => {
    render(
      <ManualAssetList
        assets={mockAssets}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Car')).toBeInTheDocument();
  });

  it('should render empty state when no assets', () => {
    render(
      <ManualAssetList
        assets={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(
      screen.getByText(/No manual assets yet/i)
    ).toBeInTheDocument();
  });

  it('should pass callbacks to asset cards', () => {
    render(
      <ManualAssetList
        assets={mockAssets}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByLabelText('Edit asset');
    editButtons[0].click();

    expect(mockOnEdit).toHaveBeenCalledWith(mockAssets[0]);
  });
});
