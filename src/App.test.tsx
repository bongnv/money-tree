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

  it('should render the app with Header', () => {
    render(<App />);
    // "Money Tree" appears in both Header and main content
    const moneyTreeElements = screen.getAllByText('Money Tree');
    expect(moneyTreeElements.length).toBe(2);

    // Check for Header elements
    expect(screen.getByText('Load')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();

    // Check for main content
    expect(screen.getByText('Personal Finance Manager')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
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

