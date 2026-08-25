# abdielvega.com

Personal site + two private trackers, a single Next.js 15 App Router app deployed on Vercel.

## Three surfaces, one app

| Host                    | Content                                           | Gated                          |
| ----------------------- | ------------------------------------------------- | ------------------------------ |
| `abdielvega.com`        | Public portfolio (Home, About, Projects, Contact) | No                             |
| `budget.abdielvega.com` | Private budget tracker — "The Ledger"             | Yes — Supabase magic-link auth |
| `tv.abdielvega.com`     | Private TV series tracker — "The Marquee"         | Yes — Supabase magic-link auth |

Plus `/hiit` — a standalone, public interval timer on the apex host (linked from
`lib/portfolio/content.ts`). No auth, no database; workouts live in the URL and
`localStorage`.

The subdomain split is handled in `middleware.ts`, driven by a `GATED_APPS` list
that pairs a host pattern with a path prefix (`budget.` → `/budget`, `tv.` → `/tv`):

- Requests to a gated host are **rewritten** to `<prefix>/*` internally, and only pass when there is an authenticated Supabase session (otherwise → `/login`).
- The `<prefix>/*` path form on the subdomain itself redirects to the bare path, so URLs never double-nest.
- Requests to any other host with a `/budget/*` or `/tv/*` path are forced through to `/404`, so each tracker is strictly on its subdomain. `localhost` is exempt so both are reachable in dev without editing `/etc/hosts`.

To add a third gated app, add one entry to `GATED_APPS` — the rewrite, the auth
gate, and the apex-side hiding all follow from it.

## Layout

```
app/
  (site)/               # portfolio (uses shared Masthead/Nav/Footer)
    layout.tsx
    page.tsx            # /
    about/page.tsx
    projects/page.tsx   # fetches GitHub repos via lib/portfolio/github.ts
    contact/page.tsx
  budget/               # budget tracker (private)
    layout.tsx          # redirects to /login if not authed
    page.tsx            # mounts <BudgetTracker />
  tv/                   # TV tracker (private)
    layout.tsx          # auth gate + <TvNav> + PWA manifest/icon metadata
    page.tsx            # Up Next
    shows/page.tsx      # library grid (follows, archive, watchlist, lists)
    show/[tmdbId]/      # show detail — seasons, episodes, where to watch
    search/page.tsx
    calendar/page.tsx   # upcoming air dates
    stats/page.tsx      # totals + activity heatmap
    actions.ts          # all TV server actions (follow, watch, lists, …)
  hiit/                 # public interval timer (Builder/Runner/schema/presets)
  login/page.tsx        # magic-link form; brand switches on the host
  auth/callback/route.ts
  api/contact/route.ts  # nodemailer POST
  api/tv/sync/route.ts  # daily cron — refresh TMDB metadata + email new episodes
  api/tv/manifest/route.ts   # PWA manifest for The Marquee
  api/tv/icon/[size]/route.tsx  # generated PWA / apple-touch icons
  layout.tsx            # root html/body + fonts + pre-paint theme script
  not-found.tsx
  fonts.ts
  globals.css
components/
  site/                 # portfolio-only UI
  budget/               # budget-tracker UI (BudgetTracker, Dashboard, LogView, PlanView, SetupView, LoginForm)
  tv/                   # TvNav, ShowsLibrary, ShowDetailClient, UpNextCard,
                        # FollowButton, WantToWatchButton, ListPicker,
                        # SurpriseButton, SearchClient, ThemeToggle
lib/
  portfolio/            # content.ts, github.ts, spam.ts (contact-form filtering)
  budget/               # types, utils, theme, queries
  tv/                   # tmdb.ts (API wrapper), cache.ts (TMDB → Postgres),
                        # queries.ts, types.ts, format.ts, heatmap.ts, notify.ts
  supabase/             # client.ts (browser), server.ts (RSC), middleware.ts (edge),
                        # admin.ts (service-role, server-only)
  mail.ts               # nodemailer SMTP helper
scripts/                # one-off tsx scripts (import-tvtime, seed-anime-list)
test/                   # vitest — lib/ unit tests + components/ RTL tests
middleware.ts           # subdomain rewrite + auth gate
vercel.json             # cron: /api/tv/sync daily at 08:00 UTC
tailwind.config.ts      # editorial palette + font vars
```

## Design system — preserve

Editorial/newsprint aesthetic shared across the portfolio and both trackers.

- Fonts: Fraunces (display) + Instrument Sans (body) + JetBrains Mono (numerics)
- Palette: cream `#F5EFE4` / ink `#1A1815` / muted `#8A8178`, plus income/expense/savings accents
- Hairlines (ink at 13% alpha) instead of shadows
- Cards: white, 14px radius, flat
- Label tags: 10px tracking-wider uppercase

Tailwind exposes these as named values: `bg-cream`, `text-ink`, `text-muted`, `border-hairline`, `text-income/expense/savings/warn`, `font-display`, `font-mono-tab`.

**Dark mode** is TV-only. Colors are RGB triples in CSS custom properties
(`--ink`, …) in `app/globals.css`, re-declared under `:root.dark`. An inline
script in `app/layout.tsx` applies the saved theme before first paint — it only
opts into the system preference when the host's first label is `tv`, so the
portfolio and budget tracker stay light. `components/tv/ThemeToggle.tsx` flips
the class and persists to `localStorage`.

## Data model (Supabase)

One project, two schemas' worth of tables. Every row carries a `user_id`
(defaulted to `auth.uid()`) and RLS policies (`auth.uid() = user_id`) isolate
per-user data. Signups are gated at the Supabase auth layer (invite-only in
production). Full SQL in `DEPLOY.md`.

**Budget** — `categories`, `budget_plans`, `transactions`. New users get the
default categories seeded by an `on_auth_user_created` trigger.

**TV** — `tv_shows` and `tv_episodes` cache TMDB metadata; `tv_follows` holds
follow / archive / watchlist state; `tv_watches` is one row per watched episode,
keyed on `(show, season, episode)` rather than the episode's `tmdb_id` so
imported history records even before metadata is cached. `tv_lists` /
`tv_list_shows` back the custom lists, and `tv_notified` tracks which episodes
the cron has already emailed about. The heavier reads go through Postgres
functions — `tv_up_next()`, `tv_library()`, `tv_stats()`,
`tv_pending_notifications()`.

TMDB is never hit on page render: all app reads come from Postgres, and
`lib/tv/tmdb.ts` runs only on follow, import, and the scheduled sync.

## Local development

```sh
cp .env.local.example .env.local   # fill in the real values
npm install
npm run dev
```

To test the subdomain rewrites locally, send requests with the matching host
header: `curl -H "Host: budget.abdielvega.com" http://localhost:3000/` or
`curl -H "Host: tv.abdielvega.com" http://localhost:3000/`. On `localhost` the
`/budget/*` and `/tv/*` paths also work directly.

## Common tasks

- **Add a portfolio project manually:** not possible — projects come from GitHub. Edit `lib/portfolio/github.ts` `HIDDEN` set to hide repos, or push a new repo with a good description.
- **Add a budget category:** Setup tab in the tracker UI. Defaults seeded on first login via the SQL in `DEPLOY.md`.
- **Change bio / skills / socials:** edit `lib/portfolio/content.ts`. Single source of truth for the portfolio (including the nav links).
- **Change typography:** edit `app/fonts.ts` + `tailwind.config.ts` (fontFamily) + `app/globals.css`.
- **Change contact form behavior:** `app/api/contact/route.ts` validates, filters via `lib/portfolio/spam.ts`, and calls `lib/mail.ts`.
- **Add a TV mutation:** add a server action to `app/tv/actions.ts` — every write goes through there, and each one revalidates the affected paths.
- **Change what TMDB data is stored:** `lib/tv/cache.ts` maps the API response onto `tv_shows` / `tv_episodes`; add the column in `DEPLOY.md`'s schema too.
- **Change the new-episode email:** `lib/tv/notify.ts` builds it; `app/api/tv/sync/route.ts` decides who gets it (`TV_NOTIFY_EMAIL` → `CONTACT_INBOX` → `EMAIL`).
- **Change the sync schedule:** `vercel.json` `crons`. The route is guarded by `CRON_SECRET` (`Authorization: Bearer <secret>`).

## Scripts

- `npm run dev` — local dev at :3000
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm test` — Vitest (`npm run test:watch` to watch)

One-off maintenance scripts read `.env.local` directly and use the service-role key:

- `npx tsx scripts/import-tvtime.ts [csv]` — import a TV Time GDPR export (idempotent)
- `npx tsx scripts/seed-anime-list.ts` — build the "Anime" list from followed shows

## Deploy

See `DEPLOY.md` for the full runbook (Supabase project creation, schema for both
trackers, environment variable reference, Vercel setup, Route 53 records, AWS
decommission).
