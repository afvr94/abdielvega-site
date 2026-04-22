# Deploy runbook

Step-by-step for getting both `abdielvega.com` (portfolio) and `budget.abdielvega.com` (budget tracker) live on Vercel + Supabase.

Estimated time end-to-end: **~45 minutes**, most of it waiting for DNS.

---

## 1. Supabase — create the project + schema

1. Create a Supabase project at https://supabase.com/dashboard. Note the **region** (pick one close to you — `us-east-1` is fine).
2. Once provisioned, open **Settings → Data API** and copy:
   - Project URL → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Open **SQL Editor** and run the block below.

```sql
-- ══════════════════════════════════════════════════════════════
-- Schema
-- ══════════════════════════════════════════════════════════════

create type category_type as enum ('income', 'expense', 'savings');

create table categories (
  id              text primary key,
  name            text not null,
  type            category_type not null,
  default_amount  numeric(12, 2) not null default 0,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table budget_plans (
  month            text not null,
  category_id      text not null references categories(id) on delete cascade,
  planned_amount   numeric(12, 2) not null,
  updated_at       timestamptz not null default now(),
  primary key (month, category_id)
);

create index idx_budget_plans_month on budget_plans(month);

create table transactions (
  id           text primary key,
  date         timestamptz not null,
  category_id  text not null references categories(id) on delete restrict,
  amount       numeric(12, 2) not null check (amount > 0),
  note         text,
  created_at   timestamptz not null default now()
);

create index idx_transactions_date     on transactions(date desc);
create index idx_transactions_category on transactions(category_id);

-- ══════════════════════════════════════════════════════════════
-- Row Level Security — single-user app, any authed session = full access
-- ══════════════════════════════════════════════════════════════

alter table categories   enable row level security;
alter table budget_plans enable row level security;
alter table transactions enable row level security;

create policy "auth full access" on categories
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "auth full access" on budget_plans
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "auth full access" on transactions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ══════════════════════════════════════════════════════════════
-- Seed default categories
-- ══════════════════════════════════════════════════════════════

insert into categories (id, name, type, default_amount, sort_order) values
  ('inc_salary',    'Salary',           'income',  3500, 10),
  ('inc_side',      'Side Income',      'income',  500,  20),
  ('exp_rent',      'Rent / Mortgage',  'expense', 1200, 30),
  ('exp_groceries', 'Groceries',        'expense', 400,  40),
  ('exp_dining',    'Dining Out',       'expense', 150,  50),
  ('exp_transport', 'Transport & Fuel', 'expense', 120,  60),
  ('exp_utilities', 'Utilities',        'expense', 180,  70),
  ('exp_subs',      'Subscriptions',    'expense', 60,   80),
  ('exp_fun',       'Entertainment',    'expense', 100,  90),
  ('exp_shopping',  'Shopping',         'expense', 150,  100),
  ('sav_emergency', 'Emergency Fund',   'savings', 300,  110),
  ('sav_invest',    'Investments',      'savings', 400,  120)
on conflict (id) do nothing;
```

4. Go to **Authentication → Providers → Email**. Enable email auth. Magic links are on by default.
5. **Do not disable signups yet** — you still need to sign yourself up once. Lock it down in step 7.

---

## 2. Smoke-test locally

```sh
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GITHUB_TOKEN, EMAIL, EMAIL_PASSWORD
npm install
npm run dev
```

Visit:

- `http://localhost:3000/` — portfolio
- `http://localhost:3000/login` — login form
- Sign in with your email, check your inbox for the magic link, click it, land on `/budget`
- Add a category, add a transaction, refresh — data should persist

To simulate the subdomain locally: `curl -H "Host: budget.abdielvega.com" http://localhost:3000/`. You should be redirected to `/login`.

---

## 3. Push to GitHub

If the repo isn't on GitHub yet:

```sh
gh repo create afvr94/abdielvega-site --private --source=. --remote=origin --push
```

(Or create it in the web UI and `git push -u origin main`.)

---

## 4. Vercel — import the project

1. https://vercel.com/new → import the GitHub repo.
2. Framework: **Next.js** (auto-detected).
3. **Environment Variables** — add for both Production and Preview:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GITHUB_TOKEN` (personal access token, no scopes needed for public repos — just rate-limit bypass)
   - `EMAIL` (your Namecheap Private Email address)
   - `EMAIL_PASSWORD` (SMTP password)
   - `CONTACT_INBOX` (optional, defaults to `EMAIL`)
4. Deploy. Vercel gives you a `*.vercel.app` URL — verify the portfolio loads.

---

## 5. Vercel — add the custom domains

In **Project → Settings → Domains**:

1. Add `abdielvega.com` — Vercel will show the DNS records you need.
2. Add `www.abdielvega.com` — Vercel will offer to redirect it to the apex.
3. Add `budget.abdielvega.com` — Vercel will show a CNAME target (`cname.vercel-dns.com`).

---

## 6. Route 53 — repoint DNS

Open the Route 53 hosted zone for `abdielvega.com`:

**Apex `abdielvega.com`:**

- Delete the old record(s) pointing at AWS (likely CloudFront / S3 / API Gateway).
- Create a new **A record** with the "ALIAS / A" to Vercel's IP (Vercel will give you the exact value; currently `76.76.21.21`).
- Or, if your zone supports ANAME/ALIAS, point apex to `cname.vercel-dns.com`.

**`www.abdielvega.com`:**

- CNAME → `cname.vercel-dns.com`.

**`budget.abdielvega.com`:**

- CNAME → `cname.vercel-dns.com`.

Propagation is usually quick (minutes). Vercel's domain dashboard auto-detects when it's done and issues HTTPS certs.

---

## 7. Supabase — redirect URLs + lock down signups

Back in Supabase, **Authentication → URL Configuration**:

- **Site URL:** `https://budget.abdielvega.com`
- **Redirect URLs** (add all):
  - `https://budget.abdielvega.com/auth/callback`
  - `https://abdielvega.com/auth/callback` (harmless belt-and-suspenders)
  - `http://localhost:3000/auth/callback` (for local dev)

**Create your account:** visit `https://budget.abdielvega.com/login`, enter your email, click the magic link. You now have a user.

**Then lock signups:** Authentication → Providers → Email → **disable** "Enable new user signups". Anyone else hitting `/login` will get a magic-link email, but the account creation step will fail silently.

---

## 8. Smoke-test production

- `https://abdielvega.com` — portfolio loads, projects list from GitHub, contact form sends
- `https://abdielvega.com/budget` — **should 404** (budget path is hidden on the apex)
- `https://budget.abdielvega.com` — redirects to `/login`
- Sign in → land on the tracker → add a transaction → refresh — data persists

---

## 9. Decommission AWS

Only after production is confirmed working on Vercel:

1. Delete the CloudFormation stack(s) that the old `serverless.yml` created. From the old repo: `sls remove` — but since that code no longer exists, go to AWS Console → CloudFormation and delete the stack(s) matching `portfolio-*` or whatever name.
2. Empty and delete any S3 buckets used for the old site (not `abdielvegabucket` — that still hosts your photo + résumé).
3. Delete any Lambda functions + API Gateway routes for the old contact API.
4. Keep Route 53 (DNS is still there) and `abdielvegabucket` S3 bucket (assets).

---

## Environment variable reference

| Name                            | Where                      | Notes                                           |
| ------------------------------- | -------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Settings → API  | Public, safe to ship                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API  | Public, safe to ship (RLS enforces access)      |
| `GITHUB_TOKEN`                  | github.com/settings/tokens | Fine-grained, no scopes needed for public repos |
| `EMAIL`                         | Namecheap Private Email    | SMTP username (your email)                      |
| `EMAIL_PASSWORD`                | Namecheap Private Email    | SMTP password                                   |
| `CONTACT_INBOX`                 | Anywhere you want          | Optional, defaults to `EMAIL`                   |

---

## Rollback

If anything breaks in production:

1. **Code regression** — in Vercel, open the deployment history and click "Promote to Production" on the last known-good deploy.
2. **DNS problem** — revert the Route 53 records you changed. Vercel deploys stay live regardless.
3. **Supabase outage** — the portfolio is unaffected (no Supabase dependency). The budget tracker will error at the login screen; nothing to do but wait.
