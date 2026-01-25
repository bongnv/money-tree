import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import React from 'react';

// Mock CloudSyncService class
jest.mock('./services/cloudSync.service', () => {
  return {
    CloudSyncService: jest.fn().mockImplementation(() => ({
      uploadToCloud: jest.fn().mockResolvedValue(undefined),
      downloadFromCloud: jest.fn().mockResolvedValue(undefined),
      fullSync: jest.fn().mockResolvedValue(undefined),
      debouncedSync: jest.fn(),
      loadInitialData: jest.fn().mockResolvedValue(undefined),
      setCallbacks: jest.fn(),
      syncing: false,
      pendingChanges: false,
    })),
  };
});

// Mock SyncProvider for all tests
jest.mock('./contexts/SyncProvider', () => ({
  useSyncService: jest.fn(() => ({
    isConnected: false,
    providerName: null,
    fileName: null,
    providerType: null,
    isInitializing: false,
    isSyncing: false,
    lastSynced: null,
    setFile: jest.fn(),
    listItems: jest.fn().mockResolvedValue([]),
    fullSync: jest.fn().mockResolvedValue(undefined),
    debouncedSync: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
  SyncProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

/**
 * Custom render that wraps components with AppProvider and BrowserRouter
 */
export function renderWithProviders(ui: React.ReactElement, options?: CustomRenderOptions) {
  const { initialRoute = '/', ...renderOptions } = options || {};

  // Set initial route if needed
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AppProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
