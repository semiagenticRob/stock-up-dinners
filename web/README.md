# Stock Up Dinners — marketing site

Static marketing site for [stockupdinners.com](https://stockupdinners.com). Astro + GitHub Pages.

This is a separate npm project from the React Native app in the parent repo. Run `npm` commands from inside this `web/` directory.

## Setup

```bash
cd web
npm install
cp .env.example .env.local   # then fill in the value
npm run dev
```

## Environment variables

Public (visible in the client bundle). No secrets.

| Var | Where to get it |
|---|---|
| `PUBLIC_GA4_MEASUREMENT_ID` | GA4 admin → Data Streams → Web stream → Measurement ID (`G-XXXXXXXXXX`) |

For deploys, set this as a GitHub repo secret with the same name. The `deploy-web.yml` workflow injects it at build time.

## Signup flow

Visitors who click "Get the free plan" are redirected to the Beehiiv-hosted subscribe page at `https://stockupdinners.beehiiv.com/subscribe`. UTM parameters present on the visitor's URL at click time are appended to the redirect so attribution flows into Beehiiv. The site does not directly call Beehiiv's API.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server on `http://localhost:4321` |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run typecheck` | `astro check` — TypeScript + Astro template checks |
| `npm run test` | Vitest unit tests (utm logic) |
| `npm run test:e2e` | Playwright e2e tests (routes, OG, signup redirect) |

## Deploy

Pushing to `main` with changes under `web/**` triggers `.github/workflows/deploy-web.yml`, which builds and deploys to GitHub Pages. Pushes touching only RN-app files do not trigger this workflow.

## Domain

The custom domain (`stockupdinners.com`) is wired via `web/public/CNAME` and DNS records — see the deployment runbook in the design doc at `docs/superpowers/specs/2026-04-28-marketing-site-and-acquisition-design.md`.
