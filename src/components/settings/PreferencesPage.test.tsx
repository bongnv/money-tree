/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from '@/test-utils';
import { PreferencesPage } from './PreferencesPage';
import { useStore } from '@/contexts/StoreContext';
import { CurrencyCode } from '@/types/enums';

jest.mock('@/contexts/StoreContext');
jest.mock('./DataSyncSettings', () => ({
  DataSyncSettings: () => <div>DataSyncSettings</div>,
}));

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('PreferencesPage', () => {
  const mockSetBaseCurrency = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      setBaseCurrency: mockSetBaseCurrency,
      accounts: [],
      categories: [],
      transactionTypes: [],
      transactions: [],
      budgets: [],
      assets: [],
    } as any);
  });

  it('should render without crashing', () => {
    const { container } = render(<PreferencesPage />);
    expect(container).toBeInTheDocument();
  });
});
