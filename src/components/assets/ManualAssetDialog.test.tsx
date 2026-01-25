import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualAssetDialog } from './ManualAssetDialog';
import { AppProvider } from '../../contexts/AppContext';
import { AssetType } from '../../types/enums';
import type { ManualAsset } from '../../types/models';
import { useAssetMutations } from '../../hooks/mutations/useAssetMutations';

// Mock Dexie hooks
jest.mock('../../hooks/mutations/useAssetMutations');

// Mock cloudSync
jest.mock('../../services/cloudSync.service', () => ({
  getCloudSyncService: jest.fn(() => ({
    debouncedSync: jest.fn(),
  })),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<AppProvider>{ui}</AppProvider>);
};

describe('ManualAssetDialog', () => {
  const mockAddAsset = jest.fn();
  const mockUpdateAsset = jest.fn();
  const mockUpdateAssetValue = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAssetMutations as jest.Mock).mockReturnValue({
      addAsset: mockAddAsset,
      updateAsset: mockUpdateAsset,
      deleteAsset: jest.fn(),
      updateAssetValue: mockUpdateAssetValue,
      isLoading: false,
      error: null,
    });
  });

  describe('Create mode', () => {
    it('should render dialog with Add title', () => {
      renderWithProviders(<ManualAssetDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByText('Add Manual Asset')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderWithProviders(<ManualAssetDialog open={false} onClose={mockOnClose} />);

      expect(screen.queryByText('Add Manual Asset')).not.toBeInTheDocument();
    });

    it('should call addManualAsset when form is submitted', async () => {
      renderWithProviders(<ManualAssetDialog open={true} onClose={mockOnClose} />);

      fireEvent.change(screen.getByLabelText(/asset name/i), {
        target: { value: 'House' },
      });

      const typeField = screen.getByLabelText(/asset type/i);
      fireEvent.mouseDown(typeField);
      const realEstateOption = await screen.findByText('Real Estate');
      fireEvent.click(realEstateOption);

      fireEvent.change(screen.getByLabelText(/value/i), {
        target: { value: '500000' },
      });

      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddAsset).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'House',
            type: AssetType.REAL_ESTATE,
            valueHistory: expect.arrayContaining([expect.objectContaining({ value: 500000 })]),
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })
        );
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Edit mode', () => {
    const existingAsset: ManualAsset = {
      id: 'asset-1',
      name: 'House',
      type: AssetType.REAL_ESTATE,
      currencyCode: 'USD',
      valueHistory: [{ date: '2024-01-15', value: 500000, notes: 'Primary residence' }],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should render dialog with Edit title', () => {
      render(<ManualAssetDialog open={true} asset={existingAsset} onClose={mockOnClose} />);

      expect(screen.getByText('Edit Asset')).toBeInTheDocument();
    });

    it('should call updateManualAsset when form is submitted', async () => {
      render(<ManualAssetDialog open={true} asset={existingAsset} onClose={mockOnClose} />);

      // Use getAllByLabelText and find the number input specifically
      const valueInput = screen.getByRole('spinbutton', { name: /value/i });
      fireEvent.change(valueInput, {
        target: { value: '600000' },
      });

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateAsset).toHaveBeenCalledWith(
          'asset-1',
          expect.objectContaining({
            valueHistory: expect.arrayContaining([expect.objectContaining({ value: 600000 })]),
          })
        );
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Update Value mode', () => {
    const existingAsset: ManualAsset = {
      id: 'asset-1',
      name: 'House',
      type: AssetType.REAL_ESTATE,
      valueHistory: [{ date: '2024-01-15', value: 500000 }],
      currencyCode: 'USD',
      date: '2026-01-01',
      notes: 'Initial purchase',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should render with update value title when mode is update-value', () => {
      render(
        <ManualAssetDialog
          open={true}
          asset={existingAsset}
          onClose={mockOnClose}
          mode="update-value"
        />
      );

      expect(screen.getByText('Update Value - House')).toBeInTheDocument();
    });

    it('should show current value when in update mode', () => {
      render(
        <ManualAssetDialog
          open={true}
          asset={existingAsset}
          onClose={mockOnClose}
          mode="update-value"
        />
      );

      expect(screen.getByText(/current value/i)).toBeInTheDocument();
      expect(screen.getByText(/\$500,000\.00/)).toBeInTheDocument();
    });

    it('should call updateAssetValue when form is submitted in update mode', async () => {
      render(
        <ManualAssetDialog
          open={true}
          asset={existingAsset}
          onClose={mockOnClose}
          mode="update-value"
        />
      );

      const valueInput = screen.getByRole('spinbutton', { name: /value/i });
      fireEvent.change(valueInput, {
        target: { value: '510000' },
      });

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateAssetValue).toHaveBeenCalledWith(
          'asset-1',
          510000,
          expect.any(String),
          undefined
        );
      });
    });
  });

  describe('Cancel button', () => {
    it('should close dialog when cancel is clicked', () => {
      render(<ManualAssetDialog open={true} onClose={mockOnClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Dialog close', () => {
    it('should call onClose when dialog backdrop is clicked', () => {
      render(<ManualAssetDialog open={true} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
