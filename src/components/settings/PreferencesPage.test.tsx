/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useServiceContext } from '@/contexts/ServiceContext';
import { useStore } from '@/contexts/StoreContext';
import { useSync } from '@/contexts/SyncContext';
import { CurrencyCode } from '@/types/enums';
import { PreferencesPage } from './PreferencesPage';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/SyncContext');
jest.mock('@/contexts/ServiceContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;
const mockUseServiceContext = useServiceContext as jest.MockedFunction<typeof useServiceContext>;

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('PreferencesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStore.mockReturnValue({
      baseCurrency: CurrencyCode.USD,
      setBaseCurrency: jest.fn().mockResolvedValue(undefined),
      accounts: [],
      categories: [],
      transactionTypes: [],
      transactions: [],
      budgets: [],
      assets: [],
    } as any);
    mockUseSync.mockReturnValue({
      currentFile: null,
      status: 'synced',
      reconnect: jest.fn(),
      disconnect: jest.fn(),
    } as any);
    mockUseServiceContext.mockReturnValue({
      formatService: {
        calculateDataSize: jest.fn().mockReturnValue('1.5 KB'),
      },
      cloudService: {
        getProviderName: jest.fn().mockReturnValue('OneDrive'),
      },
    } as any);
  });

  it('should render preferences page', () => {
    renderWithRouter(<PreferencesPage />);

    expect(screen.getByTestId('preferences-page')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('should show currency settings section', () => {
    renderWithRouter(<PreferencesPage />);

    expect(screen.getByText('Currency Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Base Currency')).toBeInTheDocument();
  });

  it('should display explanation about base currency', () => {
    renderWithRouter(<PreferencesPage />);

    expect(screen.getByText(/The base currency is used/)).toBeInTheDocument();
  });

  it('should show note about changing base currency', () => {
    renderWithRouter(<PreferencesPage />);

    expect(screen.getByText(/Changing the base currency/)).toBeInTheDocument();
  });
});
