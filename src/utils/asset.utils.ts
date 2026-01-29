import type { ManualAsset, AssetValueHistory } from '../types/models';

/**
 * Asset utility functions
 */

/**
 * Get the latest (current) value from a manual asset's value history
 */
export function getAssetCurrentValue(asset: {
  valueHistory: Array<{ date: string; value: number }>;
}): number {
  if (!asset.valueHistory || asset.valueHistory.length === 0) {
    return 0;
  }
  // Sort by date descending and return the latest value
  const sorted = [...asset.valueHistory].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0].value;
}

/**
 * Add a new value entry to asset's value history
 * @param asset - The asset to update
 * @param newValue - New value for the asset
 * @param newDate - New valuation date (YYYY-MM-DD format)
 * @param notes - Optional notes about the value update
 * @param linkedTransactionId - Optional transaction ID that caused this value change
 * @returns Updated asset with new value entry added to history
 */
export function updateAssetValue(
  asset: ManualAsset,
  newValue: number,
  newDate: string,
  notes?: string,
  _linkedTransactionId?: string
): ManualAsset {
  // Create new value entry
  const newValueEntry: AssetValueHistory = {
    date: newDate,
    value: newValue,
    notes: notes,
  };

  // Add to history and sort chronologically
  const updatedHistory = [...asset.valueHistory, newValueEntry].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Return updated asset
  return {
    ...asset,
    valueHistory: updatedHistory,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get complete value history
 * @param asset - The asset to get history for
 * @returns Array of all values sorted chronologically
 */
export function getCompleteValueHistory(asset: ManualAsset): AssetValueHistory[] {
  return [...asset.valueHistory].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate asset value growth between two dates
 * @param asset - The asset to calculate growth for
 * @param startDate - Start date (YYYY-MM-DD format), optional (uses first value if not provided)
 * @param endDate - End date (YYYY-MM-DD format), optional (uses current value if not provided)
 * @returns Growth information with absolute change, percentage change, and date range
 */
export function calculateAssetValueGrowth(
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
} {
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
}
