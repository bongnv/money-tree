/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PreferencesPage } from './PreferencesPage';
import { useStore } from '@/contexts/StoreContext';
import { useSync } from '@/contexts/SyncContext';
import { useFormatService, useCloudService } from '@/contexts/ServiceContext';
import { CurrencyCode } from '@/types/enums';

jest.mock('@/contexts/StoreContext');
jest.mock('@/contexts/SyncContext');
jest.mock('@/contexts/ServiceContext');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;
const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;
const mockUseFormatService = useFormatService as jest.MockedFunction<typeof useFormatService>;
const mockUseCloudService = useCloudService as jest.MockedFunction<typeof useCloudService>;

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
    mockUseFormatService.mockReturnValue({
      calculateDataSize: jest.fn().mockReturnValue('1.5 KB'),
    } as any);
    mockUseCloudService.mockReturnValue({
      getProviderName: jest.fn().mockReturnValue('OneDrive'),
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
