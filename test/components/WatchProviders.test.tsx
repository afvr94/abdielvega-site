import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/tv/tmdb', () => ({ getWatchProviders: vi.fn() }));

import { WatchProviders } from '@/components/tv/WatchProviders';
import { getWatchProviders } from '@/lib/tv/tmdb';

describe('WatchProviders', () => {
  it('lists where to watch with the JustWatch link', async () => {
    vi.mocked(getWatchProviders).mockResolvedValueOnce({
      providers: [{ name: 'Netflix', logoUrl: null }],
      link: 'https://example.com/watch',
    });
    render(await WatchProviders({ tmdbId: 1 }));
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /justwatch/i })).toHaveAttribute(
      'href',
      'https://example.com/watch'
    );
  });

  it('renders nothing when TMDB fails', async () => {
    vi.mocked(getWatchProviders).mockRejectedValueOnce(new Error('down'));
    expect(await WatchProviders({ tmdbId: 1 })).toBeNull();
  });
});
