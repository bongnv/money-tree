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
    expect(screen.getByRole('tab', { name: /transactional/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /manual assets/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^categories$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /transaction types/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /data & sync/i })).toBeInTheDocument();
  });

  it('displays Accounts content by default', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new account/i })).toBeInTheDocument();
  });

  it('switches to Manual Assets tab when clicked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('tab', { name: /manual assets/i }));
    expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
  });

  it('switches to Categories tab and shows New Category button', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('tab', { name: /^categories$/i }));
    expect(screen.getByRole('button', { name: /new category/i })).toBeInTheDocument();
  });

  it('switches to Transaction Types tab and shows New Transaction Type button', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('tab', { name: /transaction types/i }));
    expect(screen.getByRole('button', { name: /new transaction type/i })).toBeInTheDocument();
  });

  it('switches to Data & Sync tab', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('tab', { name: /data & sync/i }));
    expect(screen.getByText(/Storage Provider/i)).toBeInTheDocument();
  });
});
