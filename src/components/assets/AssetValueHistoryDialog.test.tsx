import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetValueHistoryDialog } from './AssetValueHistoryDialog';
import type { ManualAsset } from '../../types/models';
import { AssetType } from '../../types/enums';

describe('AssetValueHistoryDialog', () => {
  const mockAsset: ManualAsset = {
    id: 'asset-1',
    name: 'Test House',
    type: AssetType.REAL_ESTATE,
    value: 550000,
    currencyId: 'usd',
    date: '2026-10-01',
    valueHistory: [
      { date: '2026-01-01', value: 500000, notes: 'Initial' },
      { date: '2026-04-01', value: 520000, notes: 'Q1 appraisal' },
      { date: '2026-07-01', value: 530000 },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const mockCallbacks = {
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with asset information', () => {
    render(<AssetValueHistoryDialog open={true} asset={mockAsset} {...mockCallbacks} />);

    expect(screen.getByText('Test House')).toBeInTheDocument();
    // Check header has current value text
    expect(screen.getByText(/Current Value:/)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<AssetValueHistoryDialog open={false} asset={mockAsset} {...mockCallbacks} />);

    expect(screen.queryByText('Test House')).not.toBeInTheDocument();
  });

  it('should display growth metrics', () => {
    render(<AssetValueHistoryDialog open={true} asset={mockAsset} {...mockCallbacks} />);

    expect(screen.getByText('Growth Metrics')).toBeInTheDocument();
    expect(screen.getByText('Start Value')).toBeInTheDocument();
  });

  it('should display historical values table', () => {
    render(<AssetValueHistoryDialog open={true} asset={mockAsset} {...mockCallbacks} />);

    expect(screen.getByText('Value History')).toBeInTheDocument();
    expect(screen.getByText('Initial')).toBeInTheDocument();
    expect(screen.getByText('Q1 appraisal')).toBeInTheDocument();
  });

  it('should display current value in table', () => {
    render(<AssetValueHistoryDialog open={true} asset={mockAsset} {...mockCallbacks} />);

    // Check that the table row with "Current Value" label exists
    expect(screen.getAllByText('Current Value').length).toBeGreaterThan(0);
  });

  it('should close dialog when Close button is clicked', () => {
    render(<AssetValueHistoryDialog open={true} asset={mockAsset} {...mockCallbacks} />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(mockCallbacks.onClose).toHaveBeenCalled();
  });

  it('should display message when no history exists', () => {
    const assetWithoutHistory: ManualAsset = {
      ...mockAsset,
      valueHistory: undefined,
    };

    render(<AssetValueHistoryDialog open={true} asset={assetWithoutHistory} {...mockCallbacks} />);

    expect(screen.getByText('No historical values recorded yet.')).toBeInTheDocument();
  });

  it('should display date range selector', () => {
    render(<AssetValueHistoryDialog open={true} asset={mockAsset} {...mockCallbacks} />);

    expect(screen.getByRole('button', { name: '3 Months' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6 Months' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 Year' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();
  });
});
