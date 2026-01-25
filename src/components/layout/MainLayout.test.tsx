import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { AppProvider } from '../../contexts/AppContext';

// Mock CloudSyncService class
jest.mock('../../services/cloudSync.service', () => ({
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
}));

// Mock SyncProvider
jest.mock('../../contexts/SyncProvider', () => ({
  useSyncService: jest.fn(() => ({
    isConnected: false,
    providerName: null,
    fileName: null,
    providerType: null,
    isSyncing: false,
    lastSynced: null,
    pendingChanges: false,
    provider: null,
    uploadToCloud: jest.fn().mockResolvedValue(undefined),
    downloadFromCloud: jest.fn().mockResolvedValue(undefined),
    fullSync: jest.fn().mockResolvedValue(undefined),
    debouncedSync: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
  SyncProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </AppProvider>
  );
};

describe('MainLayout', () => {
  it('should render children', () => {
    renderWithProviders(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render Header component', () => {
    renderWithProviders(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
