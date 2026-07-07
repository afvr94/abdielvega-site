import { describe, it, expect } from 'vitest';
import { buildNotificationEmail, type NotifyItem } from '@/lib/tv/notify';

const ep = (over: Partial<NotifyItem> = {}): NotifyItem => ({
  showName: 'Severance',
  seasonNumber: 2,
  episodeNumber: 3,
  name: 'Who Is Alive?',
  airDate: '2026-07-05',
  ...over,
});

describe('buildNotificationEmail', () => {
  it('uses a singular subject for one episode', () => {
    const { subject, text, html } = buildNotificationEmail([ep()]);
    expect(subject).toBe('New episode — Severance');
    expect(text).toContain('Severance · S02E03 — Who Is Alive?');
    expect(text).toContain('Jul 5, 2026');
    expect(html).toContain('S02E03');
    expect(text).toContain('https://tv.abdielvega.com');
  });

  it('uses a counted subject for multiple episodes', () => {
    const { subject } = buildNotificationEmail([
      ep(),
      ep({ showName: 'The Bear', seasonNumber: 4, episodeNumber: 1, name: null }),
    ]);
    expect(subject).toBe('2 new episodes to watch');
  });

  it('escapes HTML in show/episode names', () => {
    const { html } = buildNotificationEmail([ep({ showName: 'Tom & Jerry', name: '<b>x</b>' })]);
    expect(html).toContain('Tom &amp; Jerry');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<b>x</b>');
  });
});
