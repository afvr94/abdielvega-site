import { describe, it, expect } from 'vitest';
import { pickBestEpisodes } from '@/lib/tv/year';

const ep = (n: number, vote_average: number, vote_count: number) => ({
  id: n,
  season_number: 1,
  episode_number: n,
  name: `Ep ${n}`,
  overview: null,
  air_date: null,
  still_path: null,
  runtime: 24,
  vote_average,
  vote_count,
});

describe('pickBestEpisodes', () => {
  const seasons = [
    {
      showTmdbId: 7,
      season: {
        season_number: 1,
        episodes: [ep(1, 8.1, 40), ep(2, 9.6, 2), ep(3, 9.0, 30), ep(4, 9.9, 50)],
      },
    },
  ];

  it('ranks only watched episodes with enough votes, best first', () => {
    const best = pickBestEpisodes(
      [
        [7, 1, 1],
        [7, 1, 2],
        [7, 1, 3],
      ],
      seasons
    );
    expect(best.map((b) => b.episodeNumber)).toEqual([3, 1]);
    expect(best[0]).toMatchObject({ showTmdbId: 7, seasonNumber: 1, name: 'Ep 3', voteAverage: 9 });
  });

  it('caps the list', () => {
    const watched = [1, 3, 4].map((n) => [7, 1, n] as [number, number, number]);
    expect(pickBestEpisodes(watched, seasons, 2).map((b) => b.episodeNumber)).toEqual([4, 3]);
  });
});
