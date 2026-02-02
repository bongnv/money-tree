import { render } from '@testing-library/react';
import App from './App';
import { CurrencyCode } from '@/types/enums';

// Mock the hooks
jest.mock('@/hooks/useArchivePrompt');
jest.mock('@/hooks/useSyncMetadata');

// Mock child components
jest.mock('./components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

jest.mock('./routes', () => ({
  AppRoutes: () => <div data-testid="app-routes">Routes</div>,
}));

jest.mock('./components/onboarding/WelcomeDialog', () => ({
  WelcomeDialog: ({ open, onClose }: any) => (
    open ? <div data-testid="welcome-dialog"><button onClick={onClose}>Close</button></div> : null
  ),
}));

jest.mock('./components/common/CloudFilePicker', () => ({
  CloudFilePicker: ({ open, onFileSelected, onCancel }: any) => (
    open ? (
      <div data-testid="cloud-file-picker">
        <button onClick={() => onFileSelected({ name: 'test.json', id: '123' })}>Select File</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
  ),
}));

jest.mock('./components/common/NotificationSnackbar', () => ({
  NotificationSnackbar: ({ open, message, onClose }: any) => (
    open ? <div data-testid="notification-snackbar" onClick={onClose}>{message}</div> : null
  ),
}));

jest.mock('./components/common/ReconnectDialog', () => ({
  __esModule: true,
  default: ({ open, onReconnect, onDismiss, providerName }: any) => (
    open ? (
      <div data-testid="reconnect-dialog">
        <div>{providerName}</div>
        <button onClick={onReconnect}>Reconnect</button>
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    ) : null
  ),
}));

jest.mock('./components/common/ArchivePrompt', () => ({
  ArchivePrompt: ({ open, year, onGoToSettings, onRemindLater }: any) => (
    open ? (
      <div data-testid="archive-prompt">
        <div>Archive {year}</div>
        <button onClick={onGoToSettings}>Go to Settings</button>
        <button onClick={onRemindLater}>Remind Later</button>
      </div>
    ) : null
  ),
}));

// Import after mocking
import { useArchivePrompt } from '@/hooks/useArchivePrompt';
import { useBaseCurrency } from '@/hooks/useSyncMetadata';

const mockUseArchivePrompt = useArchivePrompt as jest.MockedFunction<typeof useArchivePrompt>;
const mockUseBaseCurrency = useBaseCurrency as jest.MockedFunction<typeof useBaseCurrency>;

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

    mockUseBaseCurrency.mockReturnValue(CurrencyCode.USD);
  });

  it('should render app without crashing', () => {
    render(<App />);
    // App should render with providers
    expect(document.body).toBeInTheDocument();
  });

  it('should call archive prompt hook', () => {
    render(<App />);
    expect(mockUseArchivePrompt).toHaveBeenCalled();
  });

  it('should call base currency hook', () => {
    render(<App />);
    expect(mockUseBaseCurrency).toHaveBeenCalled();
  });
});
