# Stock Up Dinners — marketing site

Static marketing site for [stockupdinners.com](https://stockupdinners.com). Astro + GitHub Pages.

This is a separate npm project from the React Native app in the parent repo. Run `npm` commands from inside this `web/` directory.

## Setup

```bash
cd web
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev
```

## Environment variables

Both are public (visible in the client bundle). No secrets.

| Var | Where to get it |
|---|---|
| `PUBLIC_BEEHIIV_SUBSCRIBE_URL` | Beehiiv dashboard → Settings → Forms → create a "Custom" form → copy its submission endpoint URL |
| `PUBLIC_GA4_MEASUREMENT_ID` | GA4 admin → Data Streams → Web stream → Measurement ID (`G-XXXXXXXXXX`) |

For deploys, set both as GitHub repo secrets with the same names. The `deploy-web.yml` workflow injects them at build time.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server on `http://localhost:4321` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run typecheck` | `astro check` — TypeScript + Astro template checks |
| `npm run test` | Vitest unit tests (utm + signup logic) |
| `npm run test:e2e` | Playwright e2e tests (routes, OG, signup flow) |

## Deploy

Pushing to `main` with changes under `web/**` triggers `.github/workflows/deploy-web.yml`, which builds and deploys to GitHub Pages. Pushes touching only RN-app files do not trigger this workflow.

## Domain

The custom domain (`stockupdinners.com`) is wired via `web/public/CNAME` and DNS records — see the deployment runbook in the design doc at `docs/superpowers/specs/2026-04-28-marketing-site-and-acquisition-design.md`.
