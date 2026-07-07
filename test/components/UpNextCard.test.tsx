import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/tv/actions', () => ({ markWatched: vi.fn().mockResolvedValue(undefined) }));

import { UpNextCard } from '@/components/tv/UpNextCard';
import { markWatched } from '@/app/tv/actions';
import { makeUpNext, makeShow, makeEpisode } from '../factories';

beforeEach(() => vi.clearAllMocks());

describe('UpNextCard', () => {
  it('renders show name, episode code + title, and progress', () => {
    const item = makeUpNext({
      show: makeShow({ tmdbId: 3, name: 'The Show' }),
      next: makeEpisode({ seasonNumber: 2, episodeNumber: 5, name: 'The Episode' }),
      airedTotal: 10,
      airedWatched: 4,
    });
    render(<UpNextCard item={item} />);
    expect(screen.getByText('The Show')).toBeInTheDocument();
    expect(screen.getByText('S02E05')).toBeInTheDocument();
    expect(screen.getByText('The Episode')).toBeInTheDocument();
    expect(screen.getByText('4/10')).toBeInTheDocument();
  });

  it('marks the next episode watched', async () => {
    const item = makeUpNext({
      show: makeShow({ tmdbId: 3 }),
      next: makeEpisode({ seasonNumber: 2, episodeNumber: 5 }),
    });
    render(<UpNextCard item={item} />);
    await userEvent.click(screen.getByRole('button', { name: /mark s02e05 watched/i }));
    expect(markWatched).toHaveBeenCalledWith(3, 2, 5);
  });

  it('renders nothing when caught up (no next episode)', () => {
    const { container } = render(<UpNextCard item={makeUpNext({ next: null })} />);
    expect(container).toBeEmptyDOMElement();
  });
});
