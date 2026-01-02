import { render, screen } from '@testing-library/react';
import { ManualAssetCard } from './ManualAssetCard';
import { AssetType } from '../../types/enums';
import type { ManualAsset } from '../../types/models';

describe('ManualAssetCard', () => {
  const mockAsset: ManualAsset = {
    id: 'asset-1',
    name: 'House',
    type: AssetType.REAL_ESTATE,
    value: 500000,
    currencyId: 'usd',
    date: '2024-01-15T00:00:00.000Z',
    notes: 'Primary residence',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render asset details', () => {
    render(<ManualAssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Real Estate')).toBeInTheDocument();
    expect(screen.getByText(/\$500,?000\.00/)).toBeInTheDocument();
    expect(screen.getByText('Primary residence')).toBeInTheDocument();
  });

  it('should render asset without notes', () => {
    const assetWithoutNotes = { ...mockAsset, notes: undefined };
    render(
      <ManualAssetCard asset={assetWithoutNotes} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.queryByText('Primary residence')).not.toBeInTheDocument();
  });

  it('should display all asset types correctly', () => {
    const testCases: Array<{ type: AssetType; label: string }> = [
      { type: AssetType.REAL_ESTATE, label: 'Real Estate' },
      { type: AssetType.SUPERANNUATION, label: 'Superannuation' },
      { type: AssetType.INVESTMENT, label: 'Investment' },
      { type: AssetType.LIABILITY, label: 'Liability' },
      { type: AssetType.OTHER, label: 'Other' },
    ];

    testCases.forEach(({ type, label }) => {
      const asset = { ...mockAsset, type };
      const { unmount } = render(
        <ManualAssetCard asset={asset} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it('should call onEdit when edit button is clicked', () => {
    render(<ManualAssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButton = screen.getByLabelText('Edit asset');
    editButton.click();

    expect(mockOnEdit).toHaveBeenCalledWith(mockAsset);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(<ManualAssetCard asset={mockAsset} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByLabelText('Delete asset');
    deleteButton.click();

    expect(mockOnDelete).toHaveBeenCalledWith(mockAsset);
  });
});
