import { AssetType, CurrencyCode } from '@/types/enums';
import type { ManualAsset } from '@/types/models';

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

/**
 * Validate asset form data
 * @param formData Form data to validate
 * @returns Array of validation errors
 */
export function validateAssetForm(formData: AssetFormData): AssetValidationError[] {
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

/**
 * Transform form data to ManualAsset entity
 * @param formData Form data to transform
 * @returns ManualAsset data ready for create/update
 */
export function transformFormToAsset(
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

/**
 * Validate asset value update data
 * @param formData Form data to validate
 * @param asset Existing asset to check for duplicate dates
 * @returns Array of validation errors
 */
export function validateAssetValueUpdate(
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

/**
 * Get asset form data from update value form
 * @param formData Value update form data
 * @returns Asset form data ready for transformation
 */
export function getAssetFormFromValue(formData: AssetFormData): AssetFormData {
  return formData;
}
