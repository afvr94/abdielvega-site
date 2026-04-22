# abdielvega.com

Personal site of Abdiel Vega. One Next.js 15 app, two surfaces:

- `abdielvega.com` — public portfolio (Home, About, Projects, Contact)
- `budget.abdielvega.com` — private budget tracker (single-user, Supabase magic-link auth)

Stack: Next.js 15 · React 19 · TypeScript · Tailwind · Supabase · Vercel.

## Quick start

```sh
cp .env.local.example .env.local    # fill in the real values
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

- `npm run dev` — start the dev server on :3000
- `npm run build` — production build
- `npm run typecheck` — TypeScript with `--noEmit`
- `npm run lint` — ESLint (`next lint`)
- `npm run format` — Prettier

## Docs

- `CLAUDE.md` — architecture, layout, design system, common tasks
- `DEPLOY.md` — step-by-step production setup (Supabase + Vercel + Route 53)
