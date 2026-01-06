import { create } from 'zustand';
import { storageService } from '../services/storage.service';
import { AlertColor } from '@mui/material';
import { DataFile } from '../types/models';
import { Currency } from '../types/enums';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface AppState {
  currentYear: number;
  fileName: string | null;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
  snackbar: SnackbarState;
  baseCurrency: Currency; // Currency for reporting
  // Conflict detection metadata
  fileContentHash: string | null;
  fileLoadedAt: string | null;
  baseVersion: DataFile | null;
  // Archive settings
  archivePromptPostponedAt: string | null; // ISO date when user clicked "Remind Me Later"
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
  showSnackbar: (message: string, severity?: AlertColor) => void;
  hideSnackbar: () => void;
  setBaseCurrency: (currencyId: Currency) => void;
  // Conflict detection actions
  setFileMetadata: (hash: string, loadedAt: string, baseVersion: DataFile) => void;
  clearFileMetadata: () => void;
  // Archive actions
  setArchivePromptPostponedAt: (timestamp: string | null) => void;
}

const getCurrentYear = (): number => {
  const stored = storageService.getCurrentYear();
  return stored || new Date().getFullYear();
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  currentYear: getCurrentYear(),
  fileName: null,
  lastSaved: null,
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
  baseCurrency: Currency.USD,
  fileContentHash: null,
  fileLoadedAt: null,
  baseVersion: null,
  archivePromptPostponedAt: storageService.getArchivePromptPostponedAt(),

  setCurrentYear: (year) => {
    storageService.setCurrentYear(year);
    set({ currentYear: year });
  },

  setFileName: (fileName) => {
    set({ fileName });
  },

  setLastSaved: (timestamp) => {
    set({ lastSaved: timestamp });
  },

  setUnsavedChanges: (hasChanges) => {
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
      snackbar: {
        open: false,
        message: '',
        severity: 'info',
      },
      baseCurrency: Currency.USD,
      fileContentHash: null,
      fileLoadedAt: null,
      baseVersion: null,
    });
  },

  showSnackbar: (message, severity = 'info') => {
    set({ snackbar: { open: true, message, severity } });
  },

  hideSnackbar: () => {
    set((state) => ({ snackbar: { ...state.snackbar, open: false } }));
  },

  setBaseCurrency: (currencyId) => {
    set({ baseCurrency: currencyId, hasUnsavedChanges: true });
  },

  setFileMetadata: (hash, loadedAt, baseVersion) => {
    set({ fileContentHash: hash, fileLoadedAt: loadedAt, baseVersion });
  },

  clearFileMetadata: () => {
    set({ fileContentHash: null, fileLoadedAt: null, baseVersion: null });
  },

  setArchivePromptPostponedAt: (timestamp) => {
    if (timestamp) {
      storageService.setArchivePromptPostponedAt(timestamp);
    } else {
      storageService.clearArchivePromptPostponedAt();
    }
    set({ archivePromptPostponedAt: timestamp });
  },
}));
