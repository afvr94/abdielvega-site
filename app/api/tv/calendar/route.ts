import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUpcoming } from '@/lib/tv/queries';
import { buildCalendar } from '@/lib/tv/ical';

export const dynamic = 'force-dynamic';

function tokenMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Calendar apps can't sign in, so the feed checks a long secret in the URL instead of a session.
export async function GET(req: NextRequest) {
  const token = process.env.TV_CALENDAR_TOKEN;
  if (!token || !tokenMatches(req.nextUrl.searchParams.get('token'), token)) {
    return new NextResponse('Not found', { status: 404 });
  }
  // Subscribed calendars drop events that leave the feed, so keep two weeks of history.
  const items = await getUpcoming(createAdminClient(), 90, 14);
  return new NextResponse(buildCalendar(items, new Date()), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'private, max-age=900',
    },
  });
}
