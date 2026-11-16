import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildDiscordMessage, sendDiscord, type NotifyItem } from '@/lib/tv/notify';

const TODAY = '2026-11-16';
const ep = (over: Partial<NotifyItem> = {}): NotifyItem => ({
  showName: 'Severance',
  seasonNumber: 2,
  episodeNumber: 3,
  airDate: TODAY,
  ...over,
});

describe('buildDiscordMessage', () => {
  it("splits tonight's episodes from earlier ones and adds the behind line", () => {
    const msg = buildDiscordMessage(
      [
        ep(),
        ep({ showName: 'The Bear', seasonNumber: 4, episodeNumber: 1, airDate: '2026-11-14' }),
      ],
      TODAY,
      { episodes: 1234, minutes: 600 }
    );
    expect(msg).toBe(
      [
        '**📺 Tonight**',
        'Severance `S02E03`',
        '**New since last time**',
        'The Bear `S04E01`',
        '-# Behind: 1,234 eps · 10 hrs · [Open cliffo](https://tv.abdielvega.com)',
      ].join('\n')
    );
  });

  it('skips empty sections and a zero behind count', () => {
    const msg = buildDiscordMessage([ep()], TODAY, { episodes: 0, minutes: 0 });
    expect(msg).not.toContain('New since last time');
    expect(msg).not.toContain('Behind');
  });

  it('escapes markdown in show names', () => {
    expect(buildDiscordMessage([ep({ showName: 'Mr_Robot *' })], TODAY)).toContain(
      'Mr\\_Robot \\*'
    );
  });

  it('groups a show onto one line and collapses consecutive episodes', () => {
    const vq = (episodeNumber: number) =>
      ep({ showName: 'VisionQuest', seasonNumber: 1, episodeNumber, airDate: '2026-11-15' });
    const msg = buildDiscordMessage(
      [vq(3), vq(4), vq(5), ep({ showName: 'Other', airDate: '2026-11-15' }), vq(8), vq(6)],
      TODAY
    );
    expect(msg).toContain('VisionQuest `S01E03–E06` `S01E08`');
    expect(msg).toContain('Other `S02E03`');
    expect(msg.indexOf('VisionQuest')).toBeLessThan(msg.indexOf('Other'));
  });

  it('caps a long backlog under Discord’s length limit', () => {
    const items = Array.from({ length: 40 }, (_, i) =>
      ep({ showName: `Show with a fairly long name ${i}`, airDate: '2026-11-01' })
    );
    const msg = buildDiscordMessage(items, TODAY, { episodes: 99999, minutes: 999999 });
    expect(msg).toContain('+15 more shows');
    expect(msg.length).toBeLessThan(2000);
  });
});

describe('sendDiscord', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts the content with mentions disabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    await sendDiscord('https://discord.test/hook', 'hi');
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      content: 'hi',
      allowed_mentions: { parse: [] },
      flags: 4,
    });
  });

  it('throws when Discord rejects the post', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad', { status: 400 })));
    await expect(sendDiscord('https://discord.test/hook', 'hi')).rejects.toThrow('discord 400');
  });
});
