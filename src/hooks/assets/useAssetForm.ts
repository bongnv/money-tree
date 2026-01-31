import { useFormState } from '../primitives/useFormState';
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
 * Wraps useFormState primitive with asset-specific validation and transformation
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

  // Custom validation function
  const validate = (data: AssetFormData | AssetValueUpdateData) => {
    if (isUpdateValueMode && asset) {
      const errors = assetService.validateAssetValueUpdate(data as AssetValueUpdateData, asset);
      return errors.reduce(
        (acc, err) => {
          acc[err.field] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );
    } else {
      const errors = assetService.validateAssetForm(data as AssetFormData);
      return errors.reduce(
        (acc, err) => {
          acc[err.field] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );
    }
  };

  // Use primitive form state hook
  const formState = useFormState(initialData, validate);

  // Custom submit handler
  const handleSubmit = async () => {
    // Validate before submit
    const errors = validate(formState.formData);
    if (Object.keys(errors).length > 0) {
      formState.setErrors(errors);
      return;
    }

    formState.setIsSubmitting(true);
    try {
      if (isUpdateValueMode && asset) {
        // Update value mode
        const valueData = formState.formData as AssetValueUpdateData;
        await assetService.addValueHistory(asset.id, {
          date: valueData.date,
          value: parseFloat(valueData.value),
          notes: valueData.note,
        });
      } else {
        const assetData = assetService.transformFormToAsset(formState.formData as AssetFormData);

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
      formState.setIsSubmitting(false);
    }
  };

  return {
    ...formState,
    handleSubmit,
    isEditMode: mode === 'edit',
    isUpdateValueMode,
  };
}
