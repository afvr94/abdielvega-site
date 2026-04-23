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
-- Schema — multi-user, per-user RLS
-- ══════════════════════════════════════════════════════════════

create type category_type as enum ('income', 'expense', 'savings');

create table categories (
  user_id         uuid not null references auth.users(id) on delete cascade default auth.uid(),
  id              text not null,
  name            text not null,
  type            category_type not null,
  default_amount  numeric(12, 2) not null default 0,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, id)
);

create table budget_plans (
  user_id          uuid not null references auth.users(id) on delete cascade default auth.uid(),
  month            text not null,
  category_id      text not null,
  planned_amount   numeric(12, 2) not null,
  updated_at       timestamptz not null default now(),
  primary key (user_id, month, category_id),
  foreign key (user_id, category_id) references categories(user_id, id) on delete cascade
);

-- (user_id, month) reads are served by the PK's leftmost prefix.
-- This index backs the (user_id, category_id) FK so cascade deletes don't scan.
create index idx_budget_plans_category on budget_plans(user_id, category_id);

create table transactions (
  user_id      uuid not null references auth.users(id) on delete cascade default auth.uid(),
  id           text primary key,
  date         timestamptz not null,
  category_id  text not null,
  amount       numeric(12, 2) not null check (amount > 0),
  note         text,
  created_at   timestamptz not null default now(),
  foreign key (user_id, category_id) references categories(user_id, id) on delete restrict
);

create index idx_transactions_date     on transactions(user_id, date desc);
create index idx_transactions_category on transactions(user_id, category_id);

-- ══════════════════════════════════════════════════════════════
-- Row Level Security — each user sees only their own rows
-- ══════════════════════════════════════════════════════════════

alter table categories   enable row level security;
alter table budget_plans enable row level security;
alter table transactions enable row level security;

create policy "own rows" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on budget_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- Seed default categories for every new user (trigger on auth.users)
-- ══════════════════════════════════════════════════════════════

create or replace function seed_default_categories_for_user()
returns trigger language plpgsql security definer as $$
begin
  insert into categories (user_id, id, name, type, default_amount, sort_order) values
    (new.id, 'inc_salary',    'Salary',           'income',  3500, 10),
    (new.id, 'inc_side',      'Side Income',      'income',  500,  20),
    (new.id, 'exp_rent',      'Rent / Mortgage',  'expense', 1200, 30),
    (new.id, 'exp_groceries', 'Groceries',        'expense', 400,  40),
    (new.id, 'exp_dining',    'Dining Out',       'expense', 150,  50),
    (new.id, 'exp_transport', 'Transport & Fuel', 'expense', 120,  60),
    (new.id, 'exp_utilities', 'Utilities',        'expense', 180,  70),
    (new.id, 'exp_subs',      'Subscriptions',    'expense', 60,   80),
    (new.id, 'exp_fun',       'Entertainment',    'expense', 100,  90),
    (new.id, 'exp_shopping',  'Shopping',         'expense', 150,  100),
    (new.id, 'sav_emergency', 'Emergency Fund',   'savings', 300,  110),
    (new.id, 'sav_invest',    'Investments',      'savings', 400,  120)
  on conflict (user_id, id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function seed_default_categories_for_user();
```

4. Go to **Authentication → Providers → Email**. Enable email auth. Magic links are on by default.
5. Keep signups enabled through step 7 so you can create your own account. After that, switch to invite-only (see step 7).

### Migrating an existing single-user deployment to multi-user

Skip this if you just ran the schema block above (fresh deploy). Only run it if your database was created with the original single-user schema (`auth.uid() is not null` policy, no `user_id` column).

```sql
-- 1. Add user_id columns (nullable while we backfill)
alter table categories   add column user_id uuid references auth.users(id) on delete cascade;
alter table budget_plans add column user_id uuid references auth.users(id) on delete cascade;
alter table transactions add column user_id uuid references auth.users(id) on delete cascade;

-- 2. Backfill every existing row to your user id.
--    Grab it from Supabase → Authentication → Users, or:
--      select id from auth.users where email = '<you>@example.com';
update categories   set user_id = '<your-uuid>' where user_id is null;
update budget_plans set user_id = '<your-uuid>' where user_id is null;
update transactions set user_id = '<your-uuid>' where user_id is null;

-- 3. Lock down: NOT NULL + default to auth.uid() so the client never has to send it
alter table categories
  alter column user_id set not null,
  alter column user_id set default auth.uid();
alter table budget_plans
  alter column user_id set not null,
  alter column user_id set default auth.uid();
alter table transactions
  alter column user_id set not null,
  alter column user_id set default auth.uid();

-- 4. Re-key so the same category id string can exist per-user
alter table budget_plans drop constraint budget_plans_category_id_fkey;
alter table transactions drop constraint transactions_category_id_fkey;

alter table categories drop constraint categories_pkey;
alter table categories add primary key (user_id, id);

alter table budget_plans
  add constraint budget_plans_category_fkey
  foreign key (user_id, category_id) references categories(user_id, id) on delete cascade;

alter table transactions
  add constraint transactions_category_fkey
  foreign key (user_id, category_id) references categories(user_id, id) on delete restrict;

-- 5. budget_plans PK needs user_id too
alter table budget_plans drop constraint budget_plans_pkey;
alter table budget_plans add primary key (user_id, month, category_id);

-- 6. Rebuild indexes for the new leading user_id column.
--    idx_budget_plans_month is redundant — the new PK's (user_id, month) prefix covers it.
drop index if exists idx_budget_plans_month;
drop index if exists idx_transactions_date;
drop index if exists idx_transactions_category;

create index idx_budget_plans_category on budget_plans(user_id, category_id);
create index idx_transactions_date     on transactions(user_id, date desc);
create index idx_transactions_category on transactions(user_id, category_id);

-- 7. Swap RLS policies from "any authed session" to "own rows only"
drop policy "auth full access" on categories;
drop policy "auth full access" on budget_plans;
drop policy "auth full access" on transactions;

create policy "own rows" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on budget_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 8. Install the signup trigger that seeds defaults for every new user
create or replace function seed_default_categories_for_user()
returns trigger language plpgsql security definer as $$
begin
  insert into categories (user_id, id, name, type, default_amount, sort_order) values
    (new.id, 'inc_salary',    'Salary',           'income',  3500, 10),
    (new.id, 'inc_side',      'Side Income',      'income',  500,  20),
    (new.id, 'exp_rent',      'Rent / Mortgage',  'expense', 1200, 30),
    (new.id, 'exp_groceries', 'Groceries',        'expense', 400,  40),
    (new.id, 'exp_dining',    'Dining Out',       'expense', 150,  50),
    (new.id, 'exp_transport', 'Transport & Fuel', 'expense', 120,  60),
    (new.id, 'exp_utilities', 'Utilities',        'expense', 180,  70),
    (new.id, 'exp_subs',      'Subscriptions',    'expense', 60,   80),
    (new.id, 'exp_fun',       'Entertainment',    'expense', 100,  90),
    (new.id, 'exp_shopping',  'Shopping',         'expense', 150,  100),
    (new.id, 'sav_emergency', 'Emergency Fund',   'savings', 300,  110),
    (new.id, 'sav_invest',    'Investments',      'savings', 400,  120)
  on conflict (user_id, id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function seed_default_categories_for_user();
```

After running the migration, redeploy the app (the `onConflict` targets in `lib/budget/queries.ts` were updated to include `user_id`).

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

## 6. DNS — repoint to Vercel

DNS for `abdielvega.com` is managed at **Namecheap** (Domain List → Manage → Advanced DNS).

**Apex `abdielvega.com`:**

- Edit the existing `ALIAS` record with host `@`. Change its value from the old CloudFront target (`d…cloudfront.net.`) to `cname.vercel-dns.com.`.

**`www.abdielvega.com`:**

- Add: `CNAME Record`, host `www`, value `cname.vercel-dns.com.`.

**`budget.abdielvega.com`:**

- Add: `CNAME Record`, host `budget`, value `cname.vercel-dns.com.`.

**ACM validation CNAMEs (`_xxxx…mjclfywhbs.acm…`):** these validated the old AWS certificates. Leave them in place for now — delete only in step 9 with the rest of the AWS decommission, so you can revert if Vercel breaks.

Propagation is usually a few minutes. Vercel's domain dashboard auto-detects when it's ready and issues HTTPS certs. **Always sanity-check against what Vercel's UI is telling you** — if Vercel shows a different target (e.g., `A 76.76.21.21`), trust Vercel over these notes.

---

## 7. Supabase — redirect URLs + lock down signups

Back in Supabase, **Authentication → URL Configuration**:

- **Site URL:** `https://budget.abdielvega.com`
- **Redirect URLs** (add all):
  - `https://budget.abdielvega.com/auth/callback`
  - `https://abdielvega.com/auth/callback` (harmless belt-and-suspenders)
  - `http://localhost:3000/auth/callback` (for local dev)

**Create your account:** visit `https://budget.abdielvega.com/login`, enter your email, click the magic link. You now have a user, and the `on_auth_user_created` trigger has seeded your default categories.

**Switch to invite-only:** Authentication → Providers → Email → **disable** "Enable new user signups". The tracker is multi-user at the database layer, but signups are gated — strangers hitting `/login` get a magic-link email but the account-creation step fails silently. To add someone, invite them from Authentication → Users → **Invite user**; the same trigger seeds their categories on first login.

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

| Name                            | Where                      | Notes                                                          |
| ------------------------------- | -------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Settings → API  | Public, safe to ship                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API  | New-format `sb_publishable_…` or legacy `anon` JWT — both work |
| `GITHUB_TOKEN`                  | github.com/settings/tokens | Fine-grained, no scopes needed for public repos                |
| `SMTP_HOST`                     | Your mail provider         | iCloud: `smtp.mail.me.com`. Namecheap: `mail.privateemail.com` |
| `SMTP_PORT`                     | Your mail provider         | iCloud: `587`. Namecheap: `465`                                |
| `SMTP_USER`                     | Your mail provider         | iCloud: `<you>@icloud.com`. Namecheap: `me@abdielvega.com`     |
| `EMAIL_PASSWORD`                | Your mail provider         | iCloud: **app-specific password** from appleid.apple.com       |
| `EMAIL`                         | You                        | From address recipients see (e.g. `me@abdielvega.com`)         |
| `CONTACT_INBOX`                 | You                        | Optional, defaults to `EMAIL`                                  |

### Apple / iCloud SMTP setup

1. https://appleid.apple.com → **Sign-In & Security → App-Specific Passwords** → generate one (label it "abdielvega.com contact"). Copy it **now** — it's shown once.
2. If you want the form to send _from_ `me@abdielvega.com` (not your `@icloud.com`), you also need **iCloud+ Custom Email Domain** set up with `abdielvega.com` verified, and that From address added as an allowed sender in iCloud Mail settings. Otherwise set `EMAIL=<you>@icloud.com` and skip.
3. Put the app-specific password in `EMAIL_PASSWORD`. Your Apple ID password will **not** work.

---

## Rollback

If anything breaks in production:

1. **Code regression** — in Vercel, open the deployment history and click "Promote to Production" on the last known-good deploy.
2. **DNS problem** — revert the Route 53 records you changed. Vercel deploys stay live regardless.
3. **Supabase outage** — the portfolio is unaffected (no Supabase dependency). The budget tracker will error at the login screen; nothing to do but wait.
