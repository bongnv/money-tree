import { useState, useCallback } from 'react';
import { useAssetService } from '../useServices';
import type { AssetFormData, AssetValueUpdateData } from '@/services/asset.service';
import type { ManualAsset } from '@/types/models';
import { AssetType, CurrencyCode } from '@/types/enums';
import { getTodayDate } from '@/utils/date.utils';

type AssetFormMode = 'create' | 'edit' | 'update-value';

interface UseAssetFormProps {
  asset?: ManualAsset;
  mode?: AssetFormMode;
  onSubmit?: () => Promise<void>;
}

/**
 * Domain hook for asset form management
 * Supports create, edit, and update-value modes
 * Manages form state with asset-specific validation and transformation
 */
export function useAssetForm({ asset, mode = 'create', onSubmit }: UseAssetFormProps = {}) {
  const assetService = useAssetService();
  const isUpdateValueMode = mode === 'update-value';

  // Initialize form data based on mode
  const initialData =
    isUpdateValueMode && asset
      ? {
          date: getTodayDate(),
          value: '',
          note: '',
        }
      : asset
        ? {
            name: asset.name,
            type: asset.type,
            currencyCode: asset.currencyCode,
            value: asset.valueHistory[asset.valueHistory.length - 1]?.value.toString() || '0',
            date: asset.valueHistory[asset.valueHistory.length - 1]?.date || getTodayDate(),
            notes: asset.valueHistory[asset.valueHistory.length - 1]?.notes,
          }
        : {
            name: '',
            type: AssetType.OTHER,
            currencyCode: CurrencyCode.USD,
            value: '0',
            date: getTodayDate(),
          };

  const [formData, setFormData] = useState<AssetFormData | AssetValueUpdateData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom validation function
  const validate = useCallback(
    (data: AssetFormData | AssetValueUpdateData) => {
      if (isUpdateValueMode && asset) {
        const validationErrors = assetService.validateAssetValueUpdate(
          data as AssetValueUpdateData,
          asset
        );
        return validationErrors.reduce(
          (acc, err) => {
            acc[err.field] = err.message;
            return acc;
          },
          {} as Record<string, string>
        );
      } else {
        const validationErrors = assetService.validateAssetForm(data as AssetFormData);
        return validationErrors.reduce(
          (acc, err) => {
            acc[err.field] = err.message;
            return acc;
          },
          {} as Record<string, string>
        );
      }
    },
    [assetService, isUpdateValueMode, asset]
  );

  const setField = useCallback(
    <K extends keyof (AssetFormData | AssetValueUpdateData)>(
      field: K,
      value: (AssetFormData | AssetValueUpdateData)[K]
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (errors[field as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Custom submit handler
  const handleSubmit = async () => {
    // Validate before submit
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isUpdateValueMode && asset) {
        // Update value mode
        const valueData = formData as AssetValueUpdateData;
        await assetService.addValueHistory(asset.id, {
          date: valueData.date,
          value: parseFloat(valueData.value),
          notes: valueData.note,
        });
      } else {
        const assetData = assetService.transformFormToAsset(formData as AssetFormData);

        if (asset && mode === 'edit') {
          // Edit mode
          await assetService.update(asset.id, assetData);
        } else {
          // Create mode
          await assetService.create(assetData);
        }
      }

      if (onSubmit) {
        await onSubmit();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    setField,
    handleSubmit,
  };
}
