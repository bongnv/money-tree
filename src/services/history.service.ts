import type { ManualAsset, AssetValueHistory } from '../types/models';

/**
 * Update asset value by moving current value to history and setting new current value
 * @param asset - The asset to update
 * @param newValue - New value for the asset
 * @param newDate - New valuation date (YYYY-MM-DD format)
 * @param notes - Optional notes about the value update
 * @returns Updated asset with new current value and old value moved to history
 */
export const updateAssetValue = (
  asset: ManualAsset,
  newValue: number,
  newDate: string,
  notes?: string
): ManualAsset => {
  // Move current value to history
  const currentValueEntry: AssetValueHistory = {
    date: asset.date,
    value: asset.value,
    notes: asset.notes,
  };

  // Get existing history or initialize empty array
  const existingHistory = asset.valueHistory || [];

  // Add current value to history and sort chronologically
  const updatedHistory = [...existingHistory, currentValueEntry].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Return updated asset with new current value
  return {
    ...asset,
    value: newValue,
    date: newDate,
    notes: notes,
    valueHistory: updatedHistory,
    updatedAt: new Date().toISOString(),
  };
};
