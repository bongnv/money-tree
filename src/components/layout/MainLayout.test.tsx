import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from './MainLayout';

// Mock CloudSyncService class
jest.mock('../../services/cloudSync.service', () => ({
  CloudSyncService: jest.fn().mockImplementation(() => ({
    uploadToCloud: jest.fn().mockResolvedValue(undefined),
    downloadFromCloud: jest.fn().mockResolvedValue(undefined),
    fullSync: jest.fn().mockResolvedValue(undefined),
    debouncedSync: jest.fn(),
    setCallbacks: jest.fn(),
    syncing: false,
    pendingChanges: false,
  })),
}));

// Mock SyncProvider
jest.mock('@/contexts/SyncContext', () => ({
  useSync: jest.fn(() => ({
    selectFile: jest.fn().mockResolvedValue(undefined),
    fullSync: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    syncStatus: {
      status: 'synced' as const,
      errorMessage: null,
      providerName: 'OneDrive',
      fileName: 'test.json',
    },
  })),
}));

// Mock AppContext
jest.mock('@/contexts/AppContext', () => ({
  useApp: jest.fn(() => ({
    snackbar: { open: false, message: '', severity: 'info' },
    showSnackbar: jest.fn(),
    hideSnackbar: jest.fn(),
    showWelcomeDialog: false,
    setShowWelcomeDialog: jest.fn(),
    showFileSelection: false,
    setShowFileSelection: jest.fn(),
    showReconnectDialog: false,
    setShowReconnectDialog: jest.fn(),
  })),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
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
