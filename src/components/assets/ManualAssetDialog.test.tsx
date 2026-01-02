import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualAssetDialog } from './ManualAssetDialog';
import { useAssetStore } from '../../stores/useAssetStore';
import { AssetType } from '../../types/enums';
import type { ManualAsset } from '../../types/models';

jest.mock('../../stores/useAssetStore');

describe('ManualAssetDialog', () => {
  const mockAddManualAsset = jest.fn();
  const mockUpdateManualAsset = jest.fn();
  const mockUpdateAssetValue = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAssetStore as unknown as jest.Mock).mockReturnValue({
      addManualAsset: mockAddManualAsset,
      updateManualAsset: mockUpdateManualAsset,
      updateAssetValue: mockUpdateAssetValue,
    });
  });

  describe('Create mode', () => {
    it('should render dialog with Add title', () => {
      render(<ManualAssetDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByText('Add Manual Asset')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ManualAssetDialog open={false} onClose={mockOnClose} />);

      expect(screen.queryByText('Add Manual Asset')).not.toBeInTheDocument();
    });

    it('should call addManualAsset when form is submitted', async () => {
      render(<ManualAssetDialog open={true} onClose={mockOnClose} />);

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
        expect(mockAddManualAsset).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'House',
            type: AssetType.REAL_ESTATE,
            value: 500000,
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
      value: 500000,
      currencyId: 'usd',
      date: '2024-01-15T00:00:00.000Z',
      notes: 'Primary residence',
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
        expect(mockUpdateManualAsset).toHaveBeenCalledWith(
          'asset-1',
          expect.objectContaining({
            value: 600000,
          })
        );
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show checkbox to enable update mode', () => {
      render(<ManualAssetDialog open={true} asset={existingAsset} onClose={mockOnClose} />);

      expect(screen.getByLabelText(/update existing value/i)).toBeInTheDocument();
    });
  });

  describe('Update Value mode', () => {
    const existingAsset: ManualAsset = {
      id: 'asset-1',
      name: 'House',
      type: AssetType.REAL_ESTATE,
      value: 500000,
      currencyId: 'usd',
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
      expect(screen.getByText(/\$500000\.00/)).toBeInTheDocument();
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
