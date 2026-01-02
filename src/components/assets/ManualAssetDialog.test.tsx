import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualAssetDialog } from './ManualAssetDialog';
import { useAssetStore } from '../../stores/useAssetStore';
import { AssetType } from '../../types/enums';
import type { ManualAsset } from '../../types/models';

jest.mock('../../stores/useAssetStore');

describe('ManualAssetDialog', () => {
  const mockAddManualAsset = jest.fn();
  const mockUpdateManualAsset = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAssetStore as unknown as jest.Mock).mockReturnValue({
      addManualAsset: mockAddManualAsset,
      updateManualAsset: mockUpdateManualAsset,
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

      fireEvent.change(screen.getByLabelText(/value/i), {
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
