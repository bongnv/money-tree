import type {
  Account,
  Category,
  TransactionType,
  Transaction,
  Budget,
  ManualAsset,
} from '@/types/models';

export interface DataSizeInput {
  accounts?: Account[];
  categories?: Category[];
  transactionTypes?: TransactionType[];
  transactions?: Transaction[];
  budgets?: Budget[];
  assets?: ManualAsset[];
}

/**
 * Format service for data presentation and calculations
 */
export class FormatService {
  /**
   * Calculate approximate file size from application data
   * @param data Application data objects
   * @returns Formatted file size string (e.g., "1.5 MB")
   */
  calculateDataSize(data: DataSizeInput): string {
    try {
      // Check if all data is loaded
      if (
        data.accounts === undefined ||
        data.categories === undefined ||
        data.transactionTypes === undefined ||
        data.transactions === undefined ||
        data.budgets === undefined ||
        data.assets === undefined
      ) {
        return 'Loading...';
      }

      // Build data object matching export format
      const dataObj = {
        accounts: data.accounts,
        categories: data.categories,
        transactionTypes: data.transactionTypes,
        transactions: data.transactions,
        budgets: data.budgets,
        manualAssets: data.assets,
      };

      // Calculate JSON size
      const jsonStr = JSON.stringify(dataObj);
      const bytes = new Blob([jsonStr]).size;

      // Format as human-readable size
      if (bytes < 1024) {
        return `${bytes} bytes`;
      } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
      } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      }
    } catch (error) {
      console.error('[FormatService] calculateDataSize error:', error);
      return 'Unknown';
    }
  }
}
