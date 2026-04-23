# abdielvega.com

Personal site + budget tracker, a single Next.js 15 App Router app deployed on Vercel.

## Two surfaces, one app

| Host                    | Content                                           | Gated                          |
| ----------------------- | ------------------------------------------------- | ------------------------------ |
| `abdielvega.com`        | Public portfolio (Home, About, Projects, Contact) | No                             |
| `budget.abdielvega.com` | Private budget tracker                            | Yes — Supabase magic-link auth |

The subdomain split is handled in `middleware.ts`:

- Requests to `budget.*` are **rewritten** to `/budget/*` internally, and only pass when there is an authenticated Supabase session.
- Requests to any other host with a `/budget/*` path are forced through to `/404`, so the budget tracker is strictly on its subdomain.

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
  login/page.tsx        # magic-link form
  auth/callback/route.ts
  api/contact/route.ts  # nodemailer POST
  layout.tsx            # root html/body + fonts
  not-found.tsx
  fonts.ts
  globals.css
components/
  site/                 # portfolio-only UI
  budget/               # budget-tracker UI (BudgetTracker, Dashboard, LogView, PlanView, SetupView, LoginForm)
lib/
  portfolio/            # content.ts, github.ts
  budget/               # types, utils, theme, queries
  supabase/             # client.ts (browser), server.ts (RSC), middleware.ts (edge)
  mail.ts               # nodemailer SMTP helper
middleware.ts           # subdomain rewrite + auth gate
tailwind.config.ts      # editorial palette + font vars
```

## Design system — preserve

Editorial/newsprint aesthetic shared across portfolio and budget tracker. See `memory/project_design_system.md` for the full reference.

- Fonts: Fraunces (display) + Instrument Sans (body) + JetBrains Mono (numerics)
- Palette: cream `#F5EFE4` / ink `#1A1815` / muted `#8A8178`, plus income/expense/savings accents
- Hairlines (ink at 13% alpha) instead of shadows
- Cards: white, 14px radius, flat
- Label tags: 10px tracking-wider uppercase

Tailwind exposes these as named values: `bg-cream`, `text-ink`, `text-muted`, `border-hairline`, `text-income/expense/savings/warn`, `font-display`, `font-mono-tab`.

## Data model (Supabase)

Three tables: `categories`, `budget_plans`, `transactions`. Each row carries a `user_id` (defaulted to `auth.uid()`); RLS policies (`auth.uid() = user_id`) isolate per-user data. New users get the default categories seeded by an `on_auth_user_created` trigger. Signups are gated at the Supabase auth layer (invite-only in production). See `DEPLOY.md` for the SQL.

## Local development

```sh
cp .env.local.example .env.local   # fill in the real values
npm install
npm run dev
```

To test the subdomain rewrite locally, send requests with the `budget.` host header: `curl -H "Host: budget.abdielvega.com" http://localhost:3000/`.

## Common tasks

- **Add a portfolio project manually:** not possible — projects come from GitHub. Edit `lib/portfolio/github.ts` `HIDDEN` set to hide repos, or push a new repo with a good description.
- **Add a budget category:** Setup tab in the tracker UI. Defaults seeded on first login via the SQL in `DEPLOY.md`.
- **Change bio / skills / socials:** edit `lib/portfolio/content.ts`. Single source of truth for the portfolio.
- **Change typography:** edit `app/fonts.ts` + `tailwind.config.ts` (fontFamily) + `app/globals.css`.
- **Change contact form behavior:** `app/api/contact/route.ts` validates and calls `lib/mail.ts`.

## Scripts

- `npm run dev` — local dev at :3000
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Deploy

See `DEPLOY.md` for the full runbook (Supabase project creation, schema, Vercel setup, Route 53 records, AWS decommission).
