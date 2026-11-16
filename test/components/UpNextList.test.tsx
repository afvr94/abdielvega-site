import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/tv/actions', () => ({
  markWatched: vi.fn().mockResolvedValue(undefined),
  markUnwatched: vi.fn().mockResolvedValue(undefined),
}));

import { UpNextList } from '@/components/tv/UpNextList';
import { markUnwatched } from '@/app/tv/actions';
import { makeUpNext, makeShow, makeEpisode } from '../factories';

const show = makeShow({ tmdbId: 3, name: 'The Show' });
const itemAt = (episodeNumber: number) =>
  makeUpNext({
    show,
    next: makeEpisode({ tmdbId: 500 + episodeNumber, seasonNumber: 2, episodeNumber }),
  });

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('UpNextList', () => {
  it('shows the next episode after one is marked', async () => {
    const { rerender } = render(<UpNextList items={[itemAt(5)]} />);
    await userEvent.click(screen.getByRole('button', { name: /mark s02e05 watched/i }));
    rerender(<UpNextList items={[itemAt(6)]} />);
    const card = screen.getByRole('button', { name: /mark s02e06 watched/i }).closest('.card');
    expect(card).not.toHaveClass('opacity-0');
    expect(card).not.toHaveClass('scale-[0.98]');
  });

  it('undoes a mark with the unmark action', async () => {
    render(<UpNextList items={[itemAt(5)]} />);
    await userEvent.click(screen.getByRole('button', { name: /mark s02e05 watched/i }));
    await userEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(markUnwatched).toHaveBeenCalledWith(3, 2, 5);
    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument();
  });

  it('offers undo for about five seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<UpNextList items={[itemAt(5)]} />);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: /mark s02e05 watched/i }));
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    // The dismiss timer starts in an effect; flush it first or the clock jumps before it exists.
    await act(async () => {});
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument();
  });

  it('keeps a retry when undo fails', async () => {
    vi.mocked(markUnwatched).mockRejectedValueOnce(new Error('offline'));
    render(<UpNextList items={[itemAt(5)]} />);
    await userEvent.click(screen.getByRole('button', { name: /mark s02e05 watched/i }));
    await userEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(await screen.findByText(/couldn.t undo/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(markUnwatched).toHaveBeenCalledTimes(2);
  });
});
