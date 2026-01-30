import { render, screen } from '@testing-library/react';
import { ExchangeRatesSettingsPage } from './ExchangeRatesSettingsPage';

// Mock ExchangeRatesSettings
jest.mock('./ExchangeRatesSettings', () => ({
  ExchangeRatesSettings: () => (
    <div data-testid="exchange-rates-settings">Exchange Rates Settings</div>
  ),
}));

describe('ExchangeRatesSettingsPage', () => {
  it('should render ExchangeRatesSettings component', () => {
    render(<ExchangeRatesSettingsPage />);
    expect(screen.getByTestId('exchange-rates-settings')).toBeInTheDocument();
  });
});
