import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn().mockResolvedValue({}) }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signOut } }),
}));

import { TvNav } from '@/components/tv/TvNav';

beforeEach(() => vi.clearAllMocks());

describe('TvNav', () => {
  it('renders the cliffo logo, nav links and sign-out, with no theme toggle', () => {
    render(<TvNav />);
    expect(screen.getByRole('img', { name: 'cliffo' })).toBeInTheDocument();
    for (const label of ['Up Next', 'Shows', 'Calendar', 'Stats', 'Search']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: /switch to (dark|light) mode/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('marks the current route and places the sliding pill on it (pathname "/")', () => {
    const { container } = render(<TvNav />);
    expect(screen.getByRole('link', { name: 'Up Next' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Shows' })).not.toHaveAttribute('aria-current');
    const pill = container.querySelector<HTMLElement>('[data-nav-pill]');
    expect(pill?.style.opacity).toBe('1');
  });

  it('signs out', async () => {
    render(<TvNav />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalled();
  });
});
