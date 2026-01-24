import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import React from 'react';

// Mock cloudSync service for all tests
jest.mock('./services/cloudSync.service', () => ({
  getCloudSyncService: jest.fn(() => ({
    fullSync: jest.fn().mockResolvedValue(undefined),
    uploadToCloud: jest.fn().mockResolvedValue(undefined),
    downloadFromCloud: jest.fn().mockResolvedValue(undefined),
    throttledSync: jest.fn(),
  })),
  initCloudSyncService: jest.fn(),
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
