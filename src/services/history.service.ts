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

/**
 * Get complete value history including current value
 * @param asset - The asset to get history for
 * @returns Array of all values sorted chronologically (history + current)
 */
export const getCompleteValueHistory = (asset: ManualAsset): AssetValueHistory[] => {
  const history = asset.valueHistory || [];
  const currentEntry: AssetValueHistory = {
    date: asset.date,
    value: asset.value,
    notes: asset.notes,
  };

  return [...history, currentEntry].sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Calculate asset value growth between two dates
 * @param asset - The asset to calculate growth for
 * @param startDate - Start date (YYYY-MM-DD format), optional (uses first value if not provided)
 * @param endDate - End date (YYYY-MM-DD format), optional (uses current value if not provided)
 * @returns Growth information with absolute change, percentage change, and date range
 */
export const calculateAssetValueGrowth = (
  asset: ManualAsset,
  startDate?: string,
  endDate?: string
): {
  startValue: number;
  endValue: number;
  startDate: string;
  endDate: string;
  absoluteChange: number;
  percentageChange: number;
} => {
  const completeHistory = getCompleteValueHistory(asset);

  if (completeHistory.length < 2) {
    throw new Error('Insufficient data to calculate growth. At least 2 values are required.');
  }

  // Find start value
  let startEntry = completeHistory[0];
  if (startDate) {
    // Find closest entry on or after startDate
    const filteredStart = completeHistory.filter((entry) => entry.date >= startDate);
    if (filteredStart.length > 0) {
      startEntry = filteredStart[0];
    }
  }

  // Find end value
  let endEntry = completeHistory[completeHistory.length - 1];
  if (endDate) {
    // Find closest entry on or before endDate
    const filteredEnd = completeHistory.filter((entry) => entry.date <= endDate);
    if (filteredEnd.length > 0) {
      endEntry = filteredEnd[filteredEnd.length - 1];
    }
  }

  const absoluteChange = endEntry.value - startEntry.value;
  const percentageChange =
    startEntry.value !== 0 ? (absoluteChange / Math.abs(startEntry.value)) * 100 : 0;

  return {
    startValue: startEntry.value,
    endValue: endEntry.value,
    startDate: startEntry.date,
    endDate: endEntry.date,
    absoluteChange,
    percentageChange,
  };
};
