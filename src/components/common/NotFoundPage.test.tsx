import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { NotFoundPage } from './NotFoundPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('NotFoundPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderNotFoundPage = () => {
    return render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
  };

  it('renders 404 heading', () => {
    renderNotFoundPage();
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });

  it('renders "Page Not Found" heading', () => {
    renderNotFoundPage();
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
  });

  it('renders descriptive message', () => {
    renderNotFoundPage();
    expect(
      screen.getByText(/The page you're looking for doesn't exist or has been moved/)
    ).toBeInTheDocument();
  });

  it('renders error icon', () => {
    const { container } = renderNotFoundPage();
    const icon = container.querySelector('svg[data-testid="ErrorOutlineIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('renders "Go to Dashboard" button', () => {
    renderNotFoundPage();
    expect(screen.getByRole('button', { name: /Go to Dashboard/i })).toBeInTheDocument();
  });

  it('renders home icon in button', () => {
    renderNotFoundPage();
    const button = screen.getByRole('button', { name: /Go to Dashboard/i });
    const icon = button.querySelector('svg[data-testid="HomeIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('navigates to home when button is clicked', async () => {
    const user = userEvent.setup();
    renderNotFoundPage();

    const button = screen.getByRole('button', { name: /Go to Dashboard/i });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('centers content vertically and horizontally', () => {
    const { container } = renderNotFoundPage();
    const box = container.querySelector('.MuiBox-root');
    const styles = window.getComputedStyle(box!);

    expect(styles.display).toBe('flex');
    expect(styles.alignItems).toBe('center');
  });

  it('uses Container with maxWidth="sm"', () => {
    const { container } = renderNotFoundPage();
    const containerElement = container.querySelector('.MuiContainer-maxWidthSm');
    expect(containerElement).toBeInTheDocument();
  });
});
