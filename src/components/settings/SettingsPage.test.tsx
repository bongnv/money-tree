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

  it('renders page title and description', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText(/Configure your assets and categories/i)).toBeInTheDocument();
  });

  it('renders Assets and Categories cards', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('navigates to /settings/assets when Assets card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByText('Assets'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings/assets');
  });

  it('navigates to /settings/categories when Categories card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByText('Categories'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings/categories');
  });

  it('renders card descriptions', () => {
    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );
    expect(
      screen.getByText(/Manage your transactional accounts and manual assets/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Organize your transaction types and categories/i)).toBeInTheDocument();
  });
});
