import type { MoneyTreeDB } from '../db/database';
import type { ManualAsset, AssetValueHistory } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';
import { generateId } from '../utils/id.utils';

const addTimestamps = (entity: Partial<ManualAsset>, isUpdate = false): Partial<ManualAsset> => {
  const now = new Date().toISOString();
  return {
    ...entity,
    createdAt: isUpdate ? entity.createdAt : entity.createdAt || now,
    updatedAt: now,
  };
};

const softDelete = (entity: Partial<ManualAsset>): Partial<ManualAsset> => ({
  ...entity,
  isDeleted: true,
});

export class AssetService {
  constructor(
    private db: MoneyTreeDB,
    private syncMetadata: SyncMetadataService
  ) {}

  async getAll(): Promise<ManualAsset[]> {
    return await this.db.manualAssets.toArray();
  }

  async getById(id: string): Promise<ManualAsset | undefined> {
    return await this.db.manualAssets.get(id);
  }

  async getActive(): Promise<ManualAsset[]> {
    return await this.db.manualAssets.filter((asset) => !asset.isDeleted).toArray();
  }

  async create(
    data: Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<string> {
    const id = generateId();
    const asset = addTimestamps({
      ...data,
      id,
      isDeleted: false,
      valueHistory: data.valueHistory || [],
    });

    await this.db.manualAssets.add(asset as ManualAsset);
    await this.syncMetadata.setLastModified();
    return id;
  }

  async update(
    id: string,
    data: Partial<Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await this.db.manualAssets.get(id);
    if (!existing) {
      throw new Error(`Asset with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await this.db.manualAssets.update(id, updated);
    await this.syncMetadata.setLastModified();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.db.manualAssets.get(id);
    if (!existing) {
      throw new Error(`Asset with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await this.db.manualAssets.update(id, deleted);
    await this.syncMetadata.setLastModified();
  }

  async addValueHistory(assetId: string, entry: AssetValueHistory): Promise<void> {
    const asset = await this.db.manualAssets.get(assetId);
    if (!asset) {
      throw new Error(`Asset with id ${assetId} not found`);
    }

    const updatedHistory = [...(asset.valueHistory || []), entry];

    await this.update(assetId, {
      valueHistory: updatedHistory,
    });
  }
}
