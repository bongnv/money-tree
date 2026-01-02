import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AssetsPage } from './AssetsPage';

// Mock the page components
jest.mock('../accounts/AccountsPage', () => ({
  AccountsPage: () => <div>Accounts Page Content</div>,
}));

jest.mock('../assets/ManualAssetsPage', () => ({
  ManualAssetsPage: () => <div>Manual Assets Page Content</div>,
}));

describe('AssetsPage', () => {
  it('renders page title', () => {
    render(
      <BrowserRouter>
        <AssetsPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Assets')).toBeInTheDocument();
  });

  it('renders Transactional and Manual tabs', () => {
    render(
      <BrowserRouter>
        <AssetsPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Transactional')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  it('shows Transactional tab by default', () => {
    render(
      <BrowserRouter>
        <AssetsPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Accounts Page Content')).toBeInTheDocument();
  });

  it('switches to Manual tab when clicked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AssetsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByText('Manual'));
    expect(screen.getByText('Manual Assets Page Content')).toBeInTheDocument();
  });

  it('switches back to Transactional tab', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AssetsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByText('Manual'));
    await user.click(screen.getByText('Transactional'));
    expect(screen.getByText('Accounts Page Content')).toBeInTheDocument();
  });

  it('hides non-active tab content', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AssetsPage />
      </BrowserRouter>
    );

    // Initially Transactional tab is visible
    expect(screen.getByText('Accounts Page Content')).toBeInTheDocument();

    // Switch to Manual tab
    await user.click(screen.getByText('Manual'));

    // Check that Manual content is now visible
    expect(screen.getByText('Manual Assets Page Content')).toBeInTheDocument();

    // Check that only Manual content is visible (Transactional is not)
    expect(screen.queryByText('Accounts Page Content')).not.toBeInTheDocument();
  });

  it('renders AccountsPage in Transactional tab', () => {
    render(
      <BrowserRouter>
        <AssetsPage />
      </BrowserRouter>
    );
    expect(screen.getByText('Accounts Page Content')).toBeInTheDocument();
  });

  it('renders ManualAssetsPage in Manual tab', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AssetsPage />
      </BrowserRouter>
    );

    await user.click(screen.getByText('Manual'));
    expect(screen.getByText('Manual Assets Page Content')).toBeInTheDocument();
  });
});
