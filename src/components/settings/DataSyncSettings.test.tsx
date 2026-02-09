/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from '@/test-utils';
import { DataSyncSettings } from './DataSyncSettings';
import { useSync } from '@/contexts/SyncContext';
import { useStore } from '@/contexts/StoreContext';

jest.mock('@/contexts/SyncContext');
jest.mock('@/contexts/StoreContext');

const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;
const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('DataSyncSettings', () => {
  const mockConnect = jest.fn();
  const mockDisconnect = jest.fn();
  const mockSelectFile = jest.fn();
  const mockFullSync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      accounts: [],
      categories: [],
      transactionTypes: [],
      transactions: [],
      budgets: [],
      assets: [],
    } as any);
  });

  it('should render without crashing when not connected', () => {
    mockUseSync.mockReturnValue({
      status: 'disconnected',
      errorMessage: null,
      provider: null,
      currentFile: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
      selectFile: mockSelectFile,
      fullSync: mockFullSync,
    } as any);

    const { container } = render(<DataSyncSettings />);
    expect(container).toBeInTheDocument();
  });

  it('should render without crashing when connected', () => {
    mockUseSync.mockReturnValue({
      status: 'synced',
      errorMessage: null,
      provider: { getName: () => 'OneDrive' },
      currentFile: { name: 'test.json', id: '123' },
      connect: mockConnect,
      disconnect: mockDisconnect,
      selectFile: mockSelectFile,
      fullSync: mockFullSync,
    } as any);

    const { container } = render(<DataSyncSettings />);
    expect(container).toBeInTheDocument();
  });
});
