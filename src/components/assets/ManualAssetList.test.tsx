import { render, screen } from '@testing-library/react';
import { ManualAssetList } from './ManualAssetList';
import { AssetType, CurrencyCode } from '../../types/enums';
import type { ManualAsset } from '../../types/models';

describe('ManualAssetList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockAssets: ManualAsset[] = [
    {
      id: 'asset-1',
      name: 'House',
      type: AssetType.REAL_ESTATE,
      currencyCode: CurrencyCode.USD,
      valueHistory: [{ date: '2024-01-15', value: 500000, notes: 'Primary residence' }],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
    {
      id: 'asset-2',
      name: 'Car',
      type: AssetType.OTHER,
      currencyCode: CurrencyCode.USD,
      valueHistory: [{ date: '2024-01-15', value: 25000 }],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isDeleted: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render list of assets', () => {
    render(<ManualAssetList assets={mockAssets} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Car')).toBeInTheDocument();
  });

  it('should render empty state when no assets', () => {
    render(<ManualAssetList assets={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(/No manual assets yet/i)).toBeInTheDocument();
  });

  it('should pass callbacks to asset cards', () => {
    render(<ManualAssetList assets={mockAssets} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButtons = screen.getAllByLabelText('Edit asset');
    editButtons[0].click();

    expect(mockOnEdit).toHaveBeenCalledWith(mockAssets[0]);
  });
});
