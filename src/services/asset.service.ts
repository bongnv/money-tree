import { db } from '../db/database';
import type { ManualAsset, AssetValueHistory } from '../types/models';
import { syncMetadataService } from './syncMetadata.service';

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

export const assetService = {
  async getAll(): Promise<ManualAsset[]> {
    return await db.manualAssets.toArray();
  },

  async getById(id: string): Promise<ManualAsset | undefined> {
    return await db.manualAssets.get(id);
  },

  async getActive(): Promise<ManualAsset[]> {
    return await db.manualAssets.filter((asset) => !asset.isDeleted).toArray();
  },

  async create(
    data: Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<string> {
    const asset = addTimestamps({
      ...data,
      isDeleted: false,
      valueHistory: data.valueHistory || [],
    });

    const id = await db.manualAssets.add(asset as ManualAsset);
    await syncMetadataService.setLastModified(new Date().toISOString());
    return id as string;
  },

  async update(
    id: string,
    data: Partial<Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const existing = await db.manualAssets.get(id);
    if (!existing) {
      throw new Error(`Asset with id ${id} not found`);
    }

    const updated = addTimestamps(data, true);
    await db.manualAssets.update(id, updated);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },

  async delete(id: string): Promise<void> {
    const existing = await db.manualAssets.get(id);
    if (!existing) {
      throw new Error(`Asset with id ${id} not found`);
    }

    const deleted = addTimestamps(softDelete(existing), true);
    await db.manualAssets.update(id, deleted);
    await syncMetadataService.setLastModified(new Date().toISOString());
  },

  async addValueHistory(assetId: string, entry: AssetValueHistory): Promise<void> {
    const asset = await db.manualAssets.get(assetId);
    if (!asset) {
      throw new Error(`Asset with id ${assetId} not found`);
    }

    const updatedHistory = [...(asset.valueHistory || []), entry];

    await this.update(assetId, {
      valueHistory: updatedHistory,
    });
  },
};
