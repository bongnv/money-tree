import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from './MainLayout';

describe('MainLayout', () => {
  it('should render children', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </BrowserRouter>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render Header component', () => {
    render(
      <BrowserRouter>
        <MainLayout>
          <div>Test</div>
        </MainLayout>
      </BrowserRouter>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
