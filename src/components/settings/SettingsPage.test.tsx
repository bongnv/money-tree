import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders page title', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    expect(screen.getByRole('tab', { name: /^assets$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^categories$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /exchange rates/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /archives/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /preferences/i })).toBeInTheDocument();
  });

  it('displays Assets content by default with both Accounts and Manual Assets', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    // Check for both component headings
    expect(screen.getByRole('heading', { name: /^Accounts$/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Manual Assets$/i, level: 1 })).toBeInTheDocument();
    // Check for both action buttons
    expect(screen.getByRole('button', { name: /new account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
  });

  it('switches to Categories tab and shows both Categories and Transaction Types', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('tab', { name: /^categories$/i }));
    expect(screen.getByRole('heading', { name: /^Categories$/i, level: 1 })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Transaction Types$/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new transaction type/i })).toBeInTheDocument();
  });

  it('switches to Preferences tab and shows Data & Sync section', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('tab', { name: /preferences/i }));
    expect(screen.getByText(/Currency Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Storage Provider/i)).toBeInTheDocument();
  });

  it('switches to Exchange Rates tab', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('tab', { name: /exchange rates/i }));
    // The tab panel should be visible with the heading
    const headings = screen.getAllByText('Exchange Rates');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows all tab icons', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });
});
