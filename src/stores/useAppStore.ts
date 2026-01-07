import { create } from 'zustand';
import { storageService } from '../services/storage.service';
import { AlertColor } from '@mui/material';
import { DataFile, YearData, ArchivedYearReference } from '../types/models';
import { CurrencyCode } from '../types/enums';

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
  baseCurrency: CurrencyCode; // Currency for reporting
  // Multi-year data coordination
  years: Record<string, YearData>; // All years data from file
  archivedYears: ArchivedYearReference[]; // References to archived years
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
  setBaseCurrency: (currencyCode: CurrencyCode) => void;
  // Multi-year coordination actions
  setYears: (years: Record<string, YearData>) => void;
  removeYear: (year: number) => void;
  setArchivedYears: (archivedYears: ArchivedYearReference[]) => void;
  addArchivedYear: (reference: ArchivedYearReference) => void;
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
  baseCurrency: CurrencyCode.USD,
  years: {},
  archivedYears: [],
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
      baseCurrency: CurrencyCode.USD,
      years: {},
      archivedYears: [],
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

  setBaseCurrency: (currencyCode) => {
    set({ baseCurrency: currencyCode, hasUnsavedChanges: true });
  },

  setYears: (years) => {
    set({ years });
  },

  removeYear: (year) => {
    set((state) => {
      const { [String(year)]: removed, ...remainingYears } = state.years;
      return { years: remainingYears, hasUnsavedChanges: true };
    });
  },

  setArchivedYears: (archivedYears) => {
    set({ archivedYears });
  },

  addArchivedYear: (reference) => {
    set((state) => ({
      archivedYears: [...state.archivedYears, reference],
      hasUnsavedChanges: true,
    }));
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
