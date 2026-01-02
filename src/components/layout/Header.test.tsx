import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { useAppStore } from '../../stores/useAppStore';
import { syncService } from '../../services/sync.service';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('Header', () => {
  let promptSaveIfNeededSpy: jest.SpyInstance;
  let loadDataFileSpy: jest.SpyInstance;
  let saveNowSpy: jest.SpyInstance;

  beforeEach(() => {
    useAppStore.getState().resetState();
    promptSaveIfNeededSpy = jest.spyOn(syncService, 'promptSaveIfNeeded');
    loadDataFileSpy = jest.spyOn(syncService, 'loadDataFile');
    saveNowSpy = jest.spyOn(syncService, 'saveNow');
  });

  afterEach(() => {
    promptSaveIfNeededSpy.mockRestore();
    loadDataFileSpy.mockRestore();
    saveNowSpy.mockRestore();
  });

  it('should render header with title', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('Money Tree')).toBeInTheDocument();
  });

  it('should render Load and Save buttons', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('Load')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should show file name when available', () => {
    useAppStore.getState().setFileName('money-tree-2024.json');
    renderWithRouter(<Header />);
    expect(screen.getByText('money-tree-2024.json')).toBeInTheDocument();
  });

  it('should show "Never saved" when lastSaved is null', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('Never saved')).toBeInTheDocument();
  });

  it('should call syncService.loadDataFile when Load button is clicked', async () => {
    promptSaveIfNeededSpy.mockResolvedValue(true);
    loadDataFileSpy.mockResolvedValue(undefined);

    renderWithRouter(<Header />);

    const loadButton = screen.getByText('Load');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(promptSaveIfNeededSpy).toHaveBeenCalled();
      expect(loadDataFileSpy).toHaveBeenCalled();
    });
  });

  it('should not load when promptSaveIfNeeded returns false', async () => {
    promptSaveIfNeededSpy.mockResolvedValue(false);
    loadDataFileSpy.mockResolvedValue(undefined);

    renderWithRouter(<Header />);

    const loadButton = screen.getByText('Load');
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(promptSaveIfNeededSpy).toHaveBeenCalled();
      expect(loadDataFileSpy).not.toHaveBeenCalled();
    });
  });

  it('should call syncService.saveNow when Save button is clicked', async () => {
    useAppStore.getState().setUnsavedChanges(true);
    saveNowSpy.mockResolvedValue(undefined);

    renderWithRouter(<Header />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveNowSpy).toHaveBeenCalled();
    });
  });

  it('should disable Save button when no unsaved changes', () => {
    useAppStore.getState().setUnsavedChanges(false);

    renderWithRouter(<Header />);

    const saveButton = screen.getByText('Save').closest('button');
    expect(saveButton).toBeDisabled();
  });

  it('should disable buttons when loading', () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setUnsavedChanges(true);

    renderWithRouter(<Header />);

    const loadButton = screen.getByText('Load').closest('button');
    const saveButton = screen.getByText('Save').closest('button');

    expect(loadButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it('should show loading spinner when loading', () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setUnsavedChanges(true);

    renderWithRouter(<Header />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

