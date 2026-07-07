import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/tv/actions', () => ({
  searchShows: vi.fn(),
  followShow: vi.fn().mockResolvedValue(undefined),
  unfollowShow: vi.fn().mockResolvedValue(undefined),
}));

import { SearchClient } from '@/components/tv/SearchClient';
import { searchShows } from '@/app/tv/actions';

beforeEach(() => vi.clearAllMocks());

describe('SearchClient', () => {
  it('debounces the query and renders results with a follow button', async () => {
    vi.mocked(searchShows).mockResolvedValue([
      {
        tmdbId: 1,
        name: 'Result Show',
        year: '2020',
        overview: 'ov',
        posterUrl: null,
        isFollowed: false,
      },
    ]);
    render(<SearchClient />);
    await userEvent.type(screen.getByPlaceholderText(/find a show/i), 'result');

    expect(await screen.findByText('Result Show', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(searchShows).toHaveBeenCalledWith('result');
    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    vi.mocked(searchShows).mockResolvedValue([]);
    render(<SearchClient />);
    await userEvent.type(screen.getByPlaceholderText(/find a show/i), 'zzz');

    expect(await screen.findByText(/no shows match/i, {}, { timeout: 2000 })).toBeInTheDocument();
  });
});
