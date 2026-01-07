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
 * Get the closing value for a manual asset at the end of a specific year
 */
export function getAssetClosingValue(
  asset: { valueHistory: Array<{ date: string; value: number }> },
  year: number
): number {
  if (!asset.valueHistory || asset.valueHistory.length === 0) {
    return 0;
  }

  const yearEnd = `${year}-12-31`;

  // Filter entries up to and including the year end, then get the latest
  const entriesUpToYearEnd = asset.valueHistory
    .filter((entry) => entry.date <= yearEnd)
    .sort((a, b) => b.date.localeCompare(a.date));

  return entriesUpToYearEnd.length > 0 ? entriesUpToYearEnd[0].value : 0;
}
