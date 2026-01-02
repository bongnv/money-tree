import { render, screen } from '@testing-library/react';
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
    expect(screen.getByText('Load')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();

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

  it('should show error dialog when error exists', () => {
    useAppStore.getState().setError('Test error message');
    render(<App />);
    expect(screen.getByText('Failed to Load File')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should not show error dialog when no error', () => {
    render(<App />);
    expect(screen.queryByText('Failed to Load File')).not.toBeInTheDocument();
  });

  it('should clear error when dialog is closed', () => {
    useAppStore.getState().setError('Test error message');
    render(<App />);

    const okButton = screen.getByText('OK');
    okButton.click();

    expect(useAppStore.getState().error).toBeNull();
  });
});
