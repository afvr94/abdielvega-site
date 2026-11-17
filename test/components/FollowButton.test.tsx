import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/tv/actions', () => ({
  followShow: vi.fn().mockResolvedValue(undefined),
  unfollowShow: vi.fn().mockResolvedValue(undefined),
}));

import { FollowButton } from '@/components/tv/FollowButton';
import { followShow, unfollowShow } from '@/app/tv/actions';

beforeEach(() => vi.clearAllMocks());

describe('FollowButton', () => {
  it('follows an unfollowed show', async () => {
    render(<FollowButton tmdbId={42} initialFollowed={false} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('Follow');

    await userEvent.click(btn);
    expect(followShow).toHaveBeenCalledWith(42);
    expect(await screen.findByText('Following')).toBeInTheDocument();
  });

  it('unfollows a followed show', async () => {
    render(<FollowButton tmdbId={7} initialFollowed={true} />);
    expect(screen.getByRole('button')).toHaveTextContent('Following');

    await userEvent.click(screen.getByRole('button'));
    expect(unfollowShow).toHaveBeenCalledWith(7);
    expect(await screen.findByText('Follow')).toBeInTheDocument();
  });

  it('keeps its state and says so when following fails', async () => {
    vi.mocked(followShow).mockRejectedValueOnce(new Error('offline'));
    render(<FollowButton tmdbId={42} initialFollowed={false} />);
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t follow/i);
    expect(screen.getByRole('button')).toHaveTextContent('Follow');

    await userEvent.click(screen.getByRole('button'));
    expect(followShow).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Following')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
