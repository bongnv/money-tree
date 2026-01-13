import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from './MainLayout';

// Mock syncService for Header component
const mockSyncService = {
  promptSaveIfNeeded: jest.fn(),
  loadDataFile: jest.fn(),
  syncNow: jest.fn(),
};

jest.mock('../../contexts/ServiceProviders', () => ({
  useSyncService: () => mockSyncService,
}));

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
