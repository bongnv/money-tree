import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { StoreProvider } from './contexts/StoreContext';

// Mock CloudSyncService class
jest.mock('./services/cloudSync.service', () => {
  return {
    CloudSyncService: jest.fn().mockImplementation(() => ({
      uploadToCloud: jest.fn().mockResolvedValue(undefined),
      downloadFromCloud: jest.fn().mockResolvedValue(undefined),
      fullSync: jest.fn().mockResolvedValue(undefined),
      debouncedSync: jest.fn(),
      setCallbacks: jest.fn(),
      syncing: false,
      pendingChanges: false,
    })),
  };
});

// Mock useSync for all tests (operations only)
jest.mock('./contexts/SyncContext', () => ({
  useSync: jest.fn(() => ({
    selectFile: jest.fn(),
    listItems: jest.fn().mockResolvedValue([]),
    fullSync: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    syncStatus: {
      status: 'synced',
      errorMessage: null,
      providerName: 'OneDrive',
      fileName: 'test.json',
    },
  })),
}));

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

/**
 * Custom render that wraps components with BrowserRouter and StoreProvider
 */
export function renderWithProviders(ui: React.ReactElement, options?: CustomRenderOptions) {
  const { initialRoute = '/', ...renderOptions } = options || {};

  // Set initial route if needed
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <StoreProvider>{children}</StoreProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
