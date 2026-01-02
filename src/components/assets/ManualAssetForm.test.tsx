import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualAssetForm } from './ManualAssetForm';
import { AssetType } from '../../types/enums';
import type { ManualAsset } from '../../types/models';

describe('ManualAssetForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create mode', () => {
    it('should render empty form with default values', () => {
      render(<ManualAssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/asset name/i)).toHaveValue('');
      expect(screen.getByLabelText(/asset type/i)).toHaveTextContent('Other');
      expect(screen.getByLabelText(/value/i)).toHaveValue(0);
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(<ManualAssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Asset name is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit valid form data', async () => {
      render(<ManualAssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/asset name/i), {
        target: { value: 'Super Fund' },
      });

      // Open dropdown and select type
      const typeField = screen.getByLabelText(/asset type/i);
      fireEvent.mouseDown(typeField);
      const superOption = await screen.findByText('Superannuation');
      fireEvent.click(superOption);

      fireEvent.change(screen.getByLabelText(/value/i), {
        target: { value: '500000' },
      });

      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Super Fund',
            type: AssetType.SUPERANNUATION,
            value: 500000,
            currencyId: 'usd',
          })
        );
      });
    });

    it('should validate numeric value', async () => {
      render(<ManualAssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/asset name/i), {
        target: { value: 'House' },
      });

      fireEvent.change(screen.getByLabelText(/value/i), {
        target: { value: 'not a number' },
      });

      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Value must be a valid number')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
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

    it('should render form with existing asset data', () => {
      render(
        <ManualAssetForm
          asset={existingAsset}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/asset name/i)).toHaveValue('House');
      expect(screen.getByLabelText(/value/i)).toHaveValue(500000);
      expect(screen.getByLabelText(/notes/i)).toHaveValue('Primary residence');
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('should submit updated data', async () => {
      render(
        <ManualAssetForm
          asset={existingAsset}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.change(screen.getByLabelText(/value/i), {
        target: { value: '600000' },
      });

      const submitButton = screen.getByText('Update');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'House',
            value: 600000,
          })
        );
      });
    });
  });

  describe('Asset types', () => {
    it('should display all asset types', () => {
      render(<ManualAssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const typeField = screen.getByLabelText(/asset type/i);
      fireEvent.mouseDown(typeField);

      expect(screen.getByText('Real Estate')).toBeInTheDocument();
      expect(screen.getByText('Superannuation')).toBeInTheDocument();
      expect(screen.getByText('Investment')).toBeInTheDocument();
      expect(screen.getByText('Liability')).toBeInTheDocument();
      expect(screen.getAllByText('Other').length).toBeGreaterThan(0);
    });
  });

  describe('Cancel button', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(<ManualAssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Notes field', () => {
    it('should be optional', async () => {
      render(<ManualAssetForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/asset name/i), {
        target: { value: 'Car' },
      });

      fireEvent.change(screen.getByLabelText(/value/i), {
        target: { value: '25000' },
      });

      const submitButton = screen.getByText('Create');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Car',
            value: 25000,
            notes: undefined,
          })
        );
      });
    });
  });
});
