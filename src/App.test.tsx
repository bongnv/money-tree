/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from '@testing-library/react';
import { useArchivePrompt } from '@/hooks/useArchivePrompt';
import App from './App';
import { CloudService } from './services/cloud.service';

// Mock CloudService
const mockCloudService = {
  initialize: jest.fn().mockResolvedValue(undefined),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  reconnect: jest.fn().mockResolvedValue(undefined),
  listFiles: jest.fn().mockResolvedValue([]),
  readFile: jest.fn().mockResolvedValue(new Blob()),
  writeFile: jest.fn().mockResolvedValue({ id: '123', name: 'test.json', isFolder: false }),
  getCurrentProvider: jest.fn().mockReturnValue(null),
  isAuthenticated: jest.fn().mockResolvedValue(false),
  getProvider: jest.fn().mockReturnValue(null),
} as unknown as CloudService;

// Mock the hooks
jest.mock('@/hooks/useArchivePrompt');

// Mock child components
jest.mock('./components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

jest.mock('./routes', () => ({
  AppRoutes: () => <div data-testid="app-routes">Routes</div>,
}));

jest.mock('./components/onboarding/WelcomeDialog', () => ({
  WelcomeDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="welcome-dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

jest.mock('./components/common/CloudFilePicker', () => ({
  CloudFilePicker: ({ open, onFileSelected, onCancel }: any) =>
    open ? (
      <div data-testid="cloud-file-picker">
        <button onClick={() => onFileSelected({ name: 'test.json', id: '123' })}>
          Select File
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

jest.mock('./components/common/NotificationSnackbar', () => ({
  NotificationSnackbar: ({ open, message, onClose }: any) =>
    open ? (
      <div data-testid="notification-snackbar" onClick={onClose}>
        {message}
      </div>
    ) : null,
}));

jest.mock('./components/common/ArchivePrompt', () => ({
  ArchivePrompt: ({ open, year, onGoToSettings, onRemindLater }: any) =>
    open ? (
      <div data-testid="archive-prompt">
        <div>Archive {year}</div>
        <button onClick={onGoToSettings}>Go to Settings</button>
        <button onClick={onRemindLater}>Remind Later</button>
      </div>
    ) : null,
}));
const mockUseArchivePrompt = useArchivePrompt as jest.MockedFunction<typeof useArchivePrompt>;

describe('App', () => {
  const mockHandleGoToSettings = jest.fn();
  const mockHandleRemindLater = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseArchivePrompt.mockReturnValue({
      showPrompt: false,
      archiveYear: null,
      archiveYearSummary: null,
      handleGoToSettings: mockHandleGoToSettings,
      handleRemindLater: mockHandleRemindLater,
    });
  });

  it('should render app without crashing', () => {
    render(<App cloudService={mockCloudService} />);
    // App should render with providers
    expect(document.body).toBeInTheDocument();
  });

  it('should call archive prompt hook', () => {
    render(<App cloudService={mockCloudService} />);
    expect(mockUseArchivePrompt).toHaveBeenCalled();
  });
});
