import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { useAppStore } from './stores/useAppStore';
import { syncService } from './services/sync.service';

describe('App', () => {
  let startAutoSaveSpy: jest.SpyInstance;
  let stopAutoSaveSpy: jest.SpyInstance;

  beforeEach(() => {
    useAppStore.getState().resetState();
    startAutoSaveSpy = jest.spyOn(syncService, 'startAutoSave').mockImplementation();
    stopAutoSaveSpy = jest.spyOn(syncService, 'stopAutoSave').mockImplementation();
  });

  afterEach(() => {
    startAutoSaveSpy.mockRestore();
    stopAutoSaveSpy.mockRestore();
  });

  it('should render the app with Header and Dashboard', () => {
    render(<App />);

    // Check for Header elements
    expect(screen.getByText('Money Tree')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sync/i })).toBeInTheDocument();

    // Check for Dashboard page title - use getAllByText since it appears in nav and heading
    const dashboardElements = screen.getAllByText('Dashboard');
    expect(dashboardElements.length).toBeGreaterThan(0);
  });

  it('should start auto-save on mount', () => {
    render(<App />);
    expect(startAutoSaveSpy).toHaveBeenCalled();
  });

  it('should stop auto-save on unmount', () => {
    const { unmount } = render(<App />);
    unmount();
    expect(stopAutoSaveSpy).toHaveBeenCalled();
  });
});
