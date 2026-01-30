import type { MoneyTreeDB } from '../db/database';
import type { ManualAsset, AssetValueHistory } from '../types/models';
import type { SyncMetadataService } from './syncMetadata.service';
import { AssetType, CurrencyCode } from '../types/enums';
import { generateId } from '../utils/id.utils';

export interface AssetFormData {
  name: string;
  type: AssetType;
  currencyCode: CurrencyCode;
  value: string;
  date: string;
  notes?: string;
}

export interface AssetValueUpdateData {
  date: string;
  value: string;
  note?: string;
}

export interface AssetValidationError {
  field: string;
  message: string;
}

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

  validateAssetForm(formData: AssetFormData): AssetValidationError[] {
    const errors: AssetValidationError[] = [];

    if (!formData.name.trim()) {
      errors.push({ field: 'name', message: 'Asset name is required' });
    }

    if (!formData.type) {
      errors.push({ field: 'type', message: 'Asset type is required' });
    }

    if (!formData.currencyCode) {
      errors.push({ field: 'currencyCode', message: 'Currency is required' });
    }

    const value = parseFloat(formData.value);
    if (isNaN(value)) {
      errors.push({ field: 'value', message: 'Value must be a valid number' });
    }

    if (!formData.date) {
      errors.push({ field: 'date', message: 'Date is required' });
    }

    return errors;
  }

  transformFormToAsset(
    formData: AssetFormData
  ): Omit<ManualAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> {
    return {
      name: formData.name.trim(),
      type: formData.type,
      currencyCode: formData.currencyCode,
      valueHistory: [
        {
          date: formData.date,
          value: parseFloat(formData.value),
          notes: formData.notes?.trim() || undefined,
        },
      ],
    };
  }

  validateAssetValueUpdate(
    formData: AssetValueUpdateData,
    asset: ManualAsset
  ): AssetValidationError[] {
    const errors: AssetValidationError[] = [];

    if (!formData.date) {
      errors.push({ field: 'date', message: 'Date is required' });
    }

    const value = parseFloat(formData.value);
    if (isNaN(value)) {
      errors.push({ field: 'value', message: 'Value must be a valid number' });
    }

    // Check for duplicate date in history
    if (asset.valueHistory?.some((entry) => entry.date === formData.date)) {
      errors.push({ field: 'date', message: 'An entry already exists for this date' });
    }

    return errors;
  }
}
