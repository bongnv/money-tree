import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsLayout } from './SettingsLayout';

const MockChildComponent = () => <div>Mock Child Content</div>;

const renderWithRouter = (initialPath: string = '/settings/preferences') => {
  window.history.pushState({}, 'Test page', initialPath);
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/settings" element={<SettingsLayout />}>
          <Route path="preferences" element={<MockChildComponent />} />
          <Route path="accounts" element={<MockChildComponent />} />
          <Route path="categories" element={<MockChildComponent />} />
          <Route path="exchange-rates" element={<MockChildComponent />} />
          <Route path="archives" element={<MockChildComponent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

describe('SettingsLayout', () => {
  it('renders Outlet with child content', () => {
    renderWithRouter('/settings/preferences');
    expect(screen.getByText('Mock Child Content')).toBeInTheDocument();
  });
});
