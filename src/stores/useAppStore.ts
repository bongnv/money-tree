import { create } from 'zustand';
import { AlertColor } from '@mui/material';
import { DataFile, ArchivedYearReference } from '../types/models';
import { CurrencyCode } from '../types/enums';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface AppState {
  fileName: string | null;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  snackbar: SnackbarState;
  baseCurrency: CurrencyCode; // Currency for reporting
  archivedYears: ArchivedYearReference[]; // References to archived years
  // Conflict detection metadata
  fileContentHash: string | null;
  fileLoadedAt: string | null;
  baseVersion: DataFile | null;
  // Backup metadata
  lastBackupDate: string | null; // ISO date of last successful backup
}

interface AppActions {
  setFileName: (fileName: string | null) => void;
  setLastSaved: (timestamp: string) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  markAsSaved: () => void;
  resetState: () => void;
  showSnackbar: (message: string, severity?: AlertColor) => void;
  hideSnackbar: () => void;
  setBaseCurrency: (currencyCode: CurrencyCode) => void;
  setArchivedYears: (archivedYears: ArchivedYearReference[]) => void;
  addArchivedYear: (reference: ArchivedYearReference) => void;
  // Conflict detection actions
  setFileMetadata: (hash: string, loadedAt: string, baseVersion: DataFile) => void;
  clearFileMetadata: () => void;
  // Backup actions
  setLastBackupDate: (date: string | null) => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  fileName: null,
  lastSaved: null,
  hasUnsavedChanges: false,
  isLoading: false,
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
  baseCurrency: CurrencyCode.USD,
  archivedYears: [],
  fileContentHash: null,
  fileLoadedAt: null,
  baseVersion: null,
  lastBackupDate: null,

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

  markAsSaved: () => {
    const now = new Date().toISOString();
    set({ lastSaved: now, hasUnsavedChanges: false });
  },

  resetState: () => {
    localStorage.removeItem('moneytree_storage_provider');
    set({
      fileName: null,
      lastSaved: null,
      hasUnsavedChanges: false,
      isLoading: false,
      snackbar: {
        open: false,
        message: '',
        severity: 'info',
      },
      baseCurrency: CurrencyCode.USD,
      archivedYears: [],
      fileContentHash: null,
      fileLoadedAt: null,
      baseVersion: null,
      lastBackupDate: null,
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

  setLastBackupDate: (date) => {
    set({ lastBackupDate: date, hasUnsavedChanges: true });
  },
}));
