import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { AppProvider } from '../../contexts/AppContext';

// Mock cloudSync service
jest.mock('../../services/cloudSync.service', () => ({
  getCloudSyncService: jest.fn(() => ({
    fullSync: jest.fn().mockResolvedValue(undefined),
  })),
  initCloudSyncService: jest.fn(),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </AppProvider>
  );
};

describe('MainLayout', () => {
  it('should render children', () => {
    renderWithProviders(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render Header component', () => {
    renderWithProviders(
      <MainLayout>
        <div>Test</div>
      </MainLayout>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
