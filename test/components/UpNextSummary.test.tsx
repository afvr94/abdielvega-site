import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UpNextSummary } from '@/components/tv/UpNextSummary';
import { makeEpisode, makeShow, makeUpNext } from '../factories';

const TODAY = '2026-11-16';
const airing = (name: string, airDate: string, tmdbId: number) => ({
  show: makeShow({ name }),
  episode: makeEpisode({ tmdbId, airDate, seasonNumber: 1, episodeNumber: 3 }),
});

describe('UpNextSummary', () => {
  it("lists tonight's episodes and caps the list", () => {
    const thisWeek = ['A', 'B', 'C', 'D'].map((n, i) => airing(n, TODAY, i + 1));
    render(<UpNextSummary behind={[]} thisWeek={thisWeek} behindMinutes={0} today={TODAY} />);
    expect(screen.getByText('Tonight')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('D')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('falls back to the next airing when nothing airs tonight', () => {
    const thisWeek = [airing('The Bear', '2026-11-19', 1)];
    render(<UpNextSummary behind={[]} thisWeek={thisWeek} behindMinutes={0} today={TODAY} />);
    expect(screen.getByText('Next up')).toBeInTheDocument();
    expect(screen.getByText('The Bear')).toBeInTheDocument();
    expect(screen.getByText('Thu · Nov 19')).toBeInTheDocument();
  });

  it('says so when nothing airs this week', () => {
    render(<UpNextSummary behind={[]} thisWeek={[]} behindMinutes={0} today={TODAY} />);
    expect(screen.getByText('Nothing this week')).toBeInTheDocument();
  });

  it('counts episodes left and the share watched across shows you are behind on', () => {
    const behind = [
      makeUpNext({ airedTotal: 10, airedWatched: 4 }),
      makeUpNext({ airedTotal: 30, airedWatched: 26 }),
    ];
    render(<UpNextSummary behind={behind} thisWeek={[]} behindMinutes={600} today={TODAY} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '75% watched' })).toBeInTheDocument();
    expect(screen.getByText(/10 hrs/)).toBeInTheDocument();
  });
});
