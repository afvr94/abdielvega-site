import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/tv/actions', () => ({
  markWatched: vi.fn().mockResolvedValue(undefined),
  markUnwatched: vi.fn().mockResolvedValue(undefined),
  markSeasonWatched: vi.fn().mockResolvedValue(undefined),
  markWatchedMany: vi.fn().mockResolvedValue(undefined),
  setArchived: vi.fn().mockResolvedValue(undefined),
  setWatchlist: vi.fn().mockResolvedValue(undefined),
  followShow: vi.fn().mockResolvedValue(undefined),
  unfollowShow: vi.fn().mockResolvedValue(undefined),
  addShowToList: vi.fn().mockResolvedValue(undefined),
  removeShowFromList: vi.fn().mockResolvedValue(undefined),
  createList: vi.fn().mockResolvedValue(1),
}));

import { ShowDetailClient } from '@/components/tv/ShowDetailClient';
import { markWatched, markWatchedMany } from '@/app/tv/actions';
import { makeShow, makeEpisode } from '../factories';

// 5 aired episodes across two seasons (all in the past).
const episodes = [
  makeEpisode({ tmdbId: 11, seasonNumber: 1, episodeNumber: 1, name: 'S1E1' }),
  makeEpisode({ tmdbId: 12, seasonNumber: 1, episodeNumber: 2, name: 'S1E2' }),
  makeEpisode({ tmdbId: 13, seasonNumber: 1, episodeNumber: 3, name: 'S1E3' }),
  makeEpisode({ tmdbId: 21, seasonNumber: 2, episodeNumber: 1, name: 'S2E1' }),
  makeEpisode({ tmdbId: 22, seasonNumber: 2, episodeNumber: 2, name: 'S2E2' }),
];

function renderDetail(watchedKeys: string[]) {
  return render(
    <ShowDetailClient
      show={makeShow({ tmdbId: 500, name: 'The Walking Dead' })}
      episodes={episodes}
      watchedKeys={watchedKeys}
      isFollowed={true}
      archived={false}
      watchlist={false}
    />
  );
}

function episodeRow(code: string) {
  return screen.getByText(code).closest('.card') as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('ShowDetailClient — season default', () => {
  it('opens on the season of the next-up episode', () => {
    renderDetail(['1-1']); // next up = S1E2 → season 1
    expect(screen.getByText('S01E02')).toBeInTheDocument();
    expect(screen.queryByText('S02E01')).not.toBeInTheDocument();
  });

  it('opens on the later season when the earlier one is done', () => {
    renderDetail(['1-1', '1-2', '1-3']); // next up = S2E1 → season 2
    expect(screen.getByText('S02E01')).toBeInTheDocument();
    expect(screen.queryByText('S01E01')).not.toBeInTheDocument();
  });
});

describe('ShowDetailClient — progress', () => {
  it('shows aired watched / total', () => {
    renderDetail(['1-1']);
    expect(screen.getByText('1/5')).toBeInTheDocument();
  });
});

describe('ShowDetailClient — mark previous prompt', () => {
  it('prompts when marking ahead of a gap, and Yes bulk-marks up to that point', async () => {
    renderDetail(['1-1']); // S1E2 still unwatched
    // Mark S1E3 (ahead of the S1E2 gap)
    await userEvent.click(within(episodeRow('S01E03')).getByRole('button'));
    expect(markWatched).toHaveBeenCalledWith(500, 1, 3);

    // Dialog appears
    expect(await screen.findByText('Mark previous episodes?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(markWatchedMany).toHaveBeenCalledWith(
      500,
      expect.arrayContaining([
        { season: 1, episode: 2 },
        { season: 1, episode: 3 },
      ])
    );
    expect(screen.queryByText('Mark previous episodes?')).not.toBeInTheDocument();
  });

  it('does not prompt when marking the next in-line episode (no gap)', async () => {
    renderDetail(['1-1']); // next up is S1E2
    await userEvent.click(within(episodeRow('S01E02')).getByRole('button'));
    expect(markWatched).toHaveBeenCalledWith(500, 1, 2);
    expect(screen.queryByText('Mark previous episodes?')).not.toBeInTheDocument();
  });

  it('"Never for this show" persists and closes the dialog', async () => {
    renderDetail(['1-1']);
    await userEvent.click(within(episodeRow('S01E03')).getByRole('button'));
    await screen.findByText('Mark previous episodes?');

    await userEvent.click(screen.getByRole('button', { name: /never for this show/i }));
    expect(localStorage.getItem('tv:neverMarkPrev:500')).toBe('1');
    expect(screen.queryByText('Mark previous episodes?')).not.toBeInTheDocument();
    expect(markWatchedMany).not.toHaveBeenCalled();
  });

  it('respects a stored "never" preference (no prompt)', async () => {
    localStorage.setItem('tv:neverMarkPrev:500', '1');
    renderDetail(['1-1']);
    await userEvent.click(within(episodeRow('S01E03')).getByRole('button'));
    expect(screen.queryByText('Mark previous episodes?')).not.toBeInTheDocument();
  });
});
