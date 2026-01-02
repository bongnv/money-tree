import { create } from 'zustand';
import type { ManualAsset } from '../types/models';
import { useAppStore } from './useAppStore';
import { updateAssetValue as updateAssetValueService } from '../services/history.service';

interface AssetState {
  manualAssets: ManualAsset[];
}

interface AssetActions {
  setManualAssets: (manualAssets: ManualAsset[]) => void;
  addManualAsset: (asset: ManualAsset) => void;
  updateManualAsset: (id: string, updates: Partial<ManualAsset>) => void;
  updateAssetValue: (id: string, newValue: number, newDate: string, notes?: string) => void;
  deleteManualAsset: (id: string) => void;
  getManualAssetById: (id: string) => ManualAsset | undefined;
  getManualAssetsByType: (type: ManualAsset['type']) => ManualAsset[];
  resetManualAssets: () => void;
}

export const useAssetStore = create<AssetState & AssetActions>((set, get) => ({
  manualAssets: [],

  setManualAssets: (manualAssets) => {
    set({ manualAssets });
  },

  addManualAsset: (asset) => {
    set((state) => ({
      manualAssets: [...state.manualAssets, asset],
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  updateManualAsset: (id, updates) => {
    set((state) => ({
      manualAssets: state.manualAssets.map((asset) =>
        asset.id === id ? { ...asset, ...updates, updatedAt: new Date().toISOString() } : asset
      ),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  updateAssetValue: (id, newValue, newDate, notes) => {
    set((state) => ({
      manualAssets: state.manualAssets.map((asset) => {
        if (asset.id === id) {
          return updateAssetValueService(asset, newValue, newDate, notes);
        }
        return asset;
      }),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  deleteManualAsset: (id) => {
    set((state) => ({
      manualAssets: state.manualAssets.filter((asset) => asset.id !== id),
    }));
    useAppStore.getState().setUnsavedChanges(true);
  },

  getManualAssetById: (id) => {
    return get().manualAssets.find((asset) => asset.id === id);
  },

  getManualAssetsByType: (type) => {
    return get().manualAssets.filter((asset) => asset.type === type);
  },

  resetManualAssets: () => {
    set({ manualAssets: [] });
  },
}));
