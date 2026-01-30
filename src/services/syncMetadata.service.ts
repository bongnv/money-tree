import type { MoneyTreeDB } from '../db/database';
import type { ArchivedYearReference } from '../types/models';
import { CurrencyCode } from '../types/enums';

/**
 * Service for sync metadata operations
 * Pure business logic without React dependencies
 * Domain-specific methods only - no generic get/set exposed
 */
export class SyncMetadataService {
  constructor(private db: MoneyTreeDB) {}

  /**
   * Get last modified timestamp
   */
  async getLastModified(): Promise<string | null> {
    const record = await this.db.syncMetadata.get('lastModified');
    return record?.value ? (record.value as string) : null;
  }

  /**
   * Set last modified timestamp to current time
   */
  async setLastModified(): Promise<void> {
    await this.db.syncMetadata.put({ key: 'lastModified', value: new Date().toISOString() });
  }

  /**
   * Set last modified to a specific timestamp
   * Used during cloud sync to restore remote timestamp
   */
  async setLastModifiedTimestamp(timestamp: string): Promise<void> {
    await this.db.syncMetadata.put({ key: 'lastModified', value: timestamp });
  }

  /**
   * Get base currency
   */
  async getBaseCurrency(): Promise<CurrencyCode> {
    const record = await this.db.syncMetadata.get('baseCurrency');
    return (record?.value as CurrencyCode) || CurrencyCode.USD;
  }

  /**
   * Set base currency and update lastModified
   */
  async setBaseCurrency(currency: CurrencyCode): Promise<void> {
    await this.db.syncMetadata.put({ key: 'baseCurrency', value: currency });
    await this.setLastModified();
  }

  /**
   * Get archived years
   */
  async getArchivedYears(): Promise<ArchivedYearReference[]> {
    const record = await this.db.syncMetadata.get('archivedYears');
    return (record?.value as ArchivedYearReference[]) || [];
  }

  /**
   * Set archived years (for bulk updates like sync)
   */
  async setArchivedYears(years: ArchivedYearReference[]): Promise<void> {
    await this.db.syncMetadata.put({ key: 'archivedYears', value: years });
  }

  /**
   * Add an archived year and update lastModified
   */
  async addArchivedYear(year: ArchivedYearReference): Promise<void> {
    const current = await this.getArchivedYears();
    await this.db.syncMetadata.put({ key: 'archivedYears', value: [...current, year] });
    await this.setLastModified();
  }

  /**
   * Clear all sync metadata (for testing or reset)
   */
  async clear(): Promise<void> {
    await this.db.syncMetadata.clear();
  }
}
