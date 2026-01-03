import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsLayout } from './SettingsLayout';

const MockChildComponent = () => <div>Mock Child Content</div>;

const renderWithRouter = (initialPath: string = '/settings') => {
  window.history.pushState({}, 'Test page', initialPath);
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<MockChildComponent />} />
          <Route path="assets" element={<div>Assets Page</div>} />
          <Route path="categories" element={<div>Categories Page</div>} />
          <Route path="data-sync" element={<div>Data & Sync Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

describe('SettingsLayout', () => {
  it('renders navigation items', () => {
    renderWithRouter();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Data & Sync')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    renderWithRouter('/settings/assets');
    const assetsButton = screen.getByRole('button', { name: /assets/i });
    expect(assetsButton).toHaveClass('Mui-selected');
  });

  it('navigates on item click', async () => {
    const user = userEvent.setup();
    renderWithRouter('/settings');

    await user.click(screen.getByText('Assets'));
    expect(screen.getByText('Assets Page')).toBeInTheDocument();
  });

  it('navigates to categories', async () => {
    const user = userEvent.setup();
    renderWithRouter('/settings');

    await user.click(screen.getByText('Categories'));
    expect(screen.getByText('Categories Page')).toBeInTheDocument();
  });

  it('renders Outlet with child content', () => {
    renderWithRouter('/settings');
    expect(screen.getByText('Mock Child Content')).toBeInTheDocument();
  });

  it('renders navigation icons', () => {
    renderWithRouter();
    const icons = screen.getAllByTestId(/Icon$/i);
    expect(icons.length).toBeGreaterThanOrEqual(3);
  });

  it('navigates to data-sync page', async () => {
    const user = userEvent.setup();
    renderWithRouter('/settings');

    await user.click(screen.getByText('Data & Sync'));
    expect(screen.getByText('Data & Sync Page')).toBeInTheDocument();
  });
});
