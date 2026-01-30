import { render, screen } from '@testing-library/react';
import { AssetsSettingsPage } from './AssetsSettingsPage';

// Mock child components
jest.mock('../accounts/AccountsPage', () => ({
  AccountsPage: () => <div data-testid="accounts-page">Accounts Page</div>,
}));

jest.mock('../assets/ManualAssetsPage', () => ({
  ManualAssetsPage: () => <div data-testid="manual-assets-page">Manual Assets Page</div>,
}));

describe('AssetsSettingsPage', () => {
  it('should render AccountsPage component', () => {
    render(<AssetsSettingsPage />);
    expect(screen.getByTestId('accounts-page')).toBeInTheDocument();
  });

  it('should render ManualAssetsPage component', () => {
    render(<AssetsSettingsPage />);
    expect(screen.getByTestId('manual-assets-page')).toBeInTheDocument();
  });
});
