import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getEpisodeSheet } = vi.hoisted(() => ({ getEpisodeSheet: vi.fn() }));
vi.mock('@/app/tv/actions', () => ({ getEpisodeSheet }));

import { EpisodeSheet } from '@/components/tv/EpisodeSheet';
import { makeEpisode } from '../factories';

// jsdom has no modal dialog or pointer capture support.
beforeAll(() => {
  Element.prototype.setPointerCapture = () => {};
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});

beforeEach(() => {
  getEpisodeSheet.mockReset().mockResolvedValue({
    overview: 'The team goes on a retreat.',
    runtime: 52,
    watchedAt: null,
    score: { voteAverage: 8.43, voteCount: 1203 },
  });
});

const episode = makeEpisode({
  seasonNumber: 2,
  episodeNumber: 5,
  name: 'Secret Title',
  airDate: '2026-02-07',
});

function renderSheet(watched: boolean, onToggle = vi.fn(), onClose = vi.fn(), aired = true) {
  render(
    <EpisodeSheet
      showId={9}
      episode={episode}
      watched={watched}
      aired={aired}
      onToggle={onToggle}
      onClose={onClose}
    />
  );
  return { onToggle, onClose };
}

describe('EpisodeSheet', () => {
  it('hides the title and summary of an unwatched episode until asked, and shows the TMDB score', async () => {
    renderSheet(false);
    expect(await screen.findByText(/8\.4 · 1,203/)).toBeInTheDocument();
    expect(screen.getByText(/52 min/)).toBeInTheDocument();
    expect(screen.queryByText('Secret Title')).not.toBeInTheDocument();
    expect(screen.queryByText('The team goes on a retreat.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /show details/i }));
    expect(screen.getByText('Secret Title')).toBeInTheDocument();
    expect(screen.getByText('The team goes on a retreat.')).toBeInTheDocument();
    expect(getEpisodeSheet).toHaveBeenCalledWith(9, 2, 5);
  });

  it('shows everything for a watched episode, with the watched date and undo', async () => {
    getEpisodeSheet.mockResolvedValue({
      overview: 'The team goes on a retreat.',
      runtime: 52,
      watchedAt: '2026-11-10T15:14:33Z',
      score: null,
    });
    const { onToggle } = renderSheet(true);
    expect(screen.getByText('Secret Title')).toBeInTheDocument();
    expect(await screen.findByText('No TMDB score yet')).toBeInTheDocument();
    const undo = screen.getByRole('button', { name: /watched nov 10, 2026.*undo/i });
    await userEvent.click(undo);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('marks an unwatched episode watched', async () => {
    const { onToggle } = renderSheet(false);
    await userEvent.click(screen.getByRole('button', { name: 'Mark watched' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("won't mark an unaired episode watched", () => {
    renderSheet(false, vi.fn(), vi.fn(), false);
    expect(screen.getByRole('button', { name: 'Mark watched' })).toBeDisabled();
  });

  it('says so when the details fail to load', async () => {
    getEpisodeSheet.mockRejectedValue(new Error('offline'));
    renderSheet(false);
    expect(await screen.findByText("Couldn't load details")).toBeInTheDocument();
  });

  it('closes when the backdrop is tapped', async () => {
    const { onClose } = renderSheet(false);
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the handle button', async () => {
    const { onClose } = renderSheet(false);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
