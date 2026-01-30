import { render, screen } from '@testing-library/react';
import { ArchivesSettingsPage } from './ArchivesSettingsPage';

// Mock ArchiveManager
jest.mock('./ArchiveManager', () => ({
  ArchiveManager: () => <div data-testid="archive-manager">Archive Manager</div>,
}));

describe('ArchivesSettingsPage', () => {
  it('should render ArchiveManager component', () => {
    render(<ArchivesSettingsPage />);
    expect(screen.getByTestId('archive-manager')).toBeInTheDocument();
  });
});
