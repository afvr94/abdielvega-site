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
  it('renders the wordmark, nav links, theme toggle and sign-out', () => {
    render(<TvNav />);
    expect(screen.getByText('The Marquee')).toBeInTheDocument();
    for (const label of ['Up Next', 'Shows', 'Calendar', 'Stats', 'Search']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(
      screen.getByRole('button', { name: /switch to (dark|light) mode/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('marks the current route active (pathname "/")', () => {
    render(<TvNav />);
    // usePathname is mocked to "/", so Up Next is active (inverted colors)
    expect(screen.getByRole('link', { name: 'Up Next' }).className).toContain('bg-ink');
    expect(screen.getByRole('link', { name: 'Shows' }).className).not.toContain('bg-ink');
  });

  it('signs out', async () => {
    render(<TvNav />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalled();
  });
});
