import { create } from 'zustand';
import { storageService } from '../services/storage.service';

interface AppState {
  currentYear: number;
  fileName: string | null;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AppActions {
  setCurrentYear: (year: number) => void;
  setFileName: (fileName: string | null) => void;
  setLastSaved: (timestamp: string) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  markAsSaved: () => void;
  resetState: () => void;
}

const getCurrentYear = (): number => {
  const stored = storageService.getCurrentYear();
  return stored || new Date().getFullYear();
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  currentYear: getCurrentYear(),
  fileName: storageService.getFileName(),
  lastSaved: storageService.getLastSaved(),
  hasUnsavedChanges: storageService.getUnsavedChanges(),
  isLoading: false,
  error: null,

  setCurrentYear: (year) => {
    storageService.setCurrentYear(year);
    set({ currentYear: year });
  },

  setFileName: (fileName) => {
    if (fileName) {
      storageService.setFileName(fileName);
    } else {
      storageService.clearFileName();
    }
    set({ fileName });
  },

  setLastSaved: (timestamp) => {
    storageService.setLastSaved(timestamp);
    set({ lastSaved: timestamp });
  },

  setUnsavedChanges: (hasChanges) => {
    storageService.setUnsavedChanges(hasChanges);
    set({ hasUnsavedChanges: hasChanges });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  markAsSaved: () => {
    const now = new Date().toISOString();
    storageService.setLastSaved(now);
    storageService.setUnsavedChanges(false);
    set({ lastSaved: now, hasUnsavedChanges: false });
  },

  resetState: () => {
    storageService.clearAll();
    set({
      currentYear: new Date().getFullYear(),
      fileName: null,
      lastSaved: null,
      hasUnsavedChanges: false,
      isLoading: false,
      error: null,
    });
  },
}));
