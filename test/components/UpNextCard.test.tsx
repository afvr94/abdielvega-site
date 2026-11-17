import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/tv/actions', () => ({ markWatched: vi.fn().mockResolvedValue(undefined) }));

import { UpNextCard } from '@/components/tv/UpNextCard';
import { markWatched } from '@/app/tv/actions';
import { makeUpNext, makeShow, makeEpisode } from '../factories';

beforeEach(() => vi.clearAllMocks());

describe('UpNextCard', () => {
  it('badges the first of your services that carries the show', () => {
    const item = makeUpNext({
      show: makeShow({
        providers: [
          { id: 1, name: 'Netflix', logoPath: null },
          { id: 2, name: 'Hulu', logoPath: null },
        ],
      }),
    });
    const { rerender } = render(<UpNextCard item={item} services={[2]} />);
    expect(screen.getByText('Hulu')).toBeInTheDocument();
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
    rerender(<UpNextCard item={item} services={[]} />);
    expect(screen.queryByText('Hulu')).not.toBeInTheDocument();
  });

  it('renders show name, episode code and progress, with the title hidden', () => {
    const item = makeUpNext({
      show: makeShow({ tmdbId: 3, name: 'The Show' }),
      next: makeEpisode({ seasonNumber: 2, episodeNumber: 5, name: 'The Episode' }),
      airedTotal: 10,
      airedWatched: 4,
    });
    render(<UpNextCard item={item} />);
    expect(screen.getByText('The Show')).toBeInTheDocument();
    expect(screen.getByText('S02E05')).toBeInTheDocument();
    expect(screen.getByText('4/10')).toBeInTheDocument();
    expect(screen.queryByText('The Episode')).not.toBeInTheDocument();
  });

  it('reveals the episode title on tap', async () => {
    const item = makeUpNext({ next: makeEpisode({ name: 'The Episode' }) });
    render(<UpNextCard item={item} />);
    await userEvent.click(screen.getByRole('button', { name: /show episode title/i }));
    expect(screen.getByText('The Episode')).toBeInTheDocument();
  });

  it('marks the next episode watched', async () => {
    const item = makeUpNext({
      show: makeShow({ tmdbId: 3 }),
      next: makeEpisode({ seasonNumber: 2, episodeNumber: 5 }),
    });
    render(<UpNextCard item={item} />);
    await userEvent.click(screen.getByRole('button', { name: /mark show s02e05 watched/i }));
    expect(markWatched).toHaveBeenCalledWith(3, 2, 5);
  });

  it('brings the card back with a retry when marking fails', async () => {
    vi.mocked(markWatched).mockRejectedValueOnce(new Error('offline'));
    const item = makeUpNext({
      show: makeShow({ tmdbId: 3, name: 'The Show' }),
      next: makeEpisode({ seasonNumber: 2, episodeNumber: 5 }),
    });
    render(<UpNextCard item={item} />);
    await userEvent.click(screen.getByRole('button', { name: /mark the show s02e05 watched/i }));
    expect(await screen.findByText(/couldn.t mark it watched/i)).toBeInTheDocument();
    expect(screen.getByText('The Show').closest('.card')).not.toHaveClass('opacity-0');

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(markWatched).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/couldn.t mark it watched/i)).not.toBeInTheDocument();
  });

  it('reports a successful mark', async () => {
    const onMarked = vi.fn();
    render(<UpNextCard item={makeUpNext()} onMarked={onMarked} />);
    await userEvent.click(screen.getByRole('button', { name: /watched/i }));
    expect(onMarked).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when caught up (no next episode)', () => {
    const { container } = render(<UpNextCard item={makeUpNext({ next: null })} />);
    expect(container).toBeEmptyDOMElement();
  });
});
