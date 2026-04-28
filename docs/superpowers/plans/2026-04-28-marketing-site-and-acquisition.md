# Marketing Site & Acquisition Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static marketing site at `stockupdinners.com` (deployed to GitHub Pages) that captures email via an embedded Beehiiv form, delivers the free 14-dinner PDF, and tracks attribution in GA4.

**Architecture:** Astro static site lives in a new `web/` directory in this repo, fully isolated from the React Native app (separate `package.json`, separate CI workflow path-filtered to `web/**`). All logic is client-side: the signup form `fetch()`s Beehiiv's custom-form submission URL directly. No backend. GitHub Pages serves the build artifact; the apex domain is wired as the final task only after the live site is verified.

**Tech Stack:** Astro 4, TypeScript (strict), Vitest + happy-dom (unit tests), Playwright (e2e), `@fontsource/inter`, `@fontsource/jetbrains-mono`, `@astrojs/sitemap`, GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-04-28-marketing-site-and-acquisition-design.md`

---

## File structure

Final state of `web/` — every file this plan creates.

```
web/
  package.json
  package-lock.json
  tsconfig.json
  astro.config.mjs
  vitest.config.ts
  playwright.config.ts
  .env.example
  .gitignore
  README.md
  public/
    favicon.svg
    favicon.ico
    og-default.png         # 1200×630 placeholder PNG, replace with final art before launch
    robots.txt
    CNAME                  # added in the final task only
  src/
    env.d.ts
    components/
      Wordmark.astro
      Header.astro
      Footer.astro
      Section.astro
      Hero.astro
      SignupForm.astro
      ValueProps.astro
      MealGridPreview.astro
      PDFCoverMock.astro
      FAQ.astro
    layouts/
      PageShell.astro
    pages/
      index.astro
      thanks.astro
      about.astro
      privacy.astro
      terms.astro
      404.astro
    scripts/
      utm.ts
      analytics.ts
      signup.ts
    styles/
      global.css
  tests/
    unit/
      utm.test.ts
      signup.test.ts
    e2e/
      smoke.spec.ts
      signup.spec.ts
.github/
  workflows/
    deploy-web.yml
```

A one-line note is appended to the existing root `CLAUDE.md`.

---

## Conventions

- All `npm` / `npx` commands run inside `web/` unless explicitly stated otherwise (`cd web && ...` shown explicitly when relevant).
- Commit at the end of every task. Use conventional commits — `feat(web): ...`, `test(web): ...`, `chore(web): ...`, `docs(web): ...`.
- **Testing policy:** Pure-markup Astro components are validated by e2e Playwright tests. Only TypeScript modules with branching logic (`utm.ts`, `signup.ts`) get unit tests. This is the right TDD-vs-pragmatism balance for a static site — testing trivial markup wastes time without catching anything real.
- Color tokens, type, and component shapes are pre-decided in the spec. Do not redesign — implement.

---

## Task 1: Bootstrap the Astro project at `web/`

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/astro.config.mjs`, `web/.gitignore`, `web/.env.example`, `web/src/env.d.ts`, `web/src/pages/index.astro` (placeholder)
- Modify: root `CLAUDE.md` (one-line append)

- [ ] **Step 1: Create `web/` directory and initialize package.json**

```bash
cd /Users/robertwarren/stock-up-dinners
mkdir web
cd web
cat > package.json <<'EOF'
{
  "name": "stockupdinners-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "astro check"
  }
}
EOF
```

- [ ] **Step 2: Install Astro and core dependencies**

Run from `web/`:

```bash
npm install astro@^4.16.0 typescript@^5.6.0
npm install --save-dev @astrojs/check @astrojs/sitemap@^3.2.0 @fontsource/inter@^5.1.0 @fontsource/jetbrains-mono@^5.1.0
```

- [ ] **Step 3: Write `web/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["astro/client"]
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 4: Write `web/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stockupdinners.com',
  output: 'static',
  trailingSlash: 'never',
  integrations: [sitemap()],
  build: {
    assets: '_assets',
  },
});
```

- [ ] **Step 5: Write `web/.gitignore`**

```
node_modules
dist
.astro
.env
.env.local
.env.*.local
test-results
playwright-report
playwright/.cache
coverage
```

- [ ] **Step 6: Write `web/.env.example`**

```
# Beehiiv custom-form submission URL.
# Create a custom subscribe form in Beehiiv → Settings → Forms, then paste
# the form's "Submission endpoint" URL here. Public; safe to commit at build.
PUBLIC_BEEHIIV_SUBSCRIBE_URL=

# Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX). Public; ships in client bundle.
PUBLIC_GA4_MEASUREMENT_ID=
```

- [ ] **Step 7: Write `web/src/env.d.ts`**

```ts
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_BEEHIIV_SUBSCRIBE_URL: string;
  readonly PUBLIC_GA4_MEASUREMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 8: Write a placeholder `web/src/pages/index.astro` so the build has something to render**

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Stock Up Dinners</title>
  </head>
  <body>
    <p>Bootstrap OK.</p>
  </body>
</html>
```

- [ ] **Step 9: Verify the build succeeds**

```bash
npm run build
```

Expected: exits 0, prints "Building static entrypoints", produces `dist/index.html`.

- [ ] **Step 10: Append marketing-site pointer to root `CLAUDE.md`**

Append this section to the bottom of `CLAUDE.md`:

```markdown

## Marketing site

The marketing site (`stockupdinners.com`) lives in `web/` as a separate Astro project with its own `package.json` and CI workflow. It is fully decoupled from the RN app — no shared dependencies, no shared backend. See `web/README.md` for details.
```

- [ ] **Step 11: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/ CLAUDE.md
git commit -m "feat(web): bootstrap Astro project in web/ directory"
```

---

## Task 2: Design tokens & global styles

**Files:**
- Create: `web/src/styles/global.css`
- Modify: `web/src/pages/index.astro` (load global.css)

- [ ] **Step 1: Write `web/src/styles/global.css`**

```css
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";
@import "@fontsource/inter/800.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";

:root {
  /* Color tokens */
  --c-ink: #0F172A;
  --c-body: #334155;
  --c-muted: #64748B;
  --c-bg: #FFFFFF;
  --c-bg-tint: #F8FAFC;
  --c-border: #E2E8F0;
  --c-accent: #DC2626;
  --c-accent-ink: #FFFFFF;
  --c-success: #15803D;

  /* Type */
  --f-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --f-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Layout */
  --container: 1120px;
  --pad-x: 24px;
  --pad-x-lg: 40px;
  --section-y: 64px;
  --section-y-lg: 96px;
  --r-btn: 6px;
  --r-card: 8px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--c-bg);
  color: var(--c-ink);
  font-family: var(--f-sans);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

a { color: inherit; }

img { max-width: 100%; height: auto; display: block; }

button { font-family: var(--f-sans); cursor: pointer; }

h1, h2, h3, h4 {
  font-family: var(--f-sans);
  letter-spacing: -0.02em;
  margin: 0;
}

h1 { font-size: 56px; font-weight: 800; line-height: 1.04; letter-spacing: -0.028em; }
h2 { font-size: 36px; font-weight: 800; line-height: 1.10; }
h3 { font-size: 20px; font-weight: 700; line-height: 1.25; letter-spacing: -0.015em; }

p { margin: 0; }

@media (max-width: 780px) {
  h1 { font-size: 38px; }
  h2 { font-size: 28px; }
}

/* Container */
.container {
  max-width: var(--container);
  margin: 0 auto;
  padding-left: var(--pad-x);
  padding-right: var(--pad-x);
}
@media (min-width: 780px) {
  .container { padding-left: var(--pad-x-lg); padding-right: var(--pad-x-lg); }
}

/* Section */
.section {
  padding-top: var(--section-y);
  padding-bottom: var(--section-y);
}
.section--tint {
  background: var(--c-bg-tint);
  border-top: 1px solid var(--c-border);
  border-bottom: 1px solid var(--c-border);
}
@media (min-width: 780px) {
  .section { padding-top: var(--section-y-lg); padding-bottom: var(--section-y-lg); }
}

/* Eyebrow */
.eyebrow {
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  font-weight: 700;
  color: var(--c-accent);
  text-transform: uppercase;
  margin-bottom: 10px;
}

/* Lede */
.lede {
  font-size: 16px;
  color: var(--c-body);
  line-height: 1.6;
  max-width: 620px;
  margin-top: 16px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  padding: 14px 20px;
  border-radius: var(--r-btn);
  font-weight: 700;
  font-size: 14px;
  background: var(--c-ink);
  color: #fff;
  text-decoration: none;
  transition: transform 80ms ease, box-shadow 80ms ease;
}
.btn:hover { transform: translateY(-1px); box-shadow: 0 1px 0 rgba(15,23,42,0.08); }
.btn--secondary { background: #fff; color: var(--c-ink); border: 1px solid var(--c-border); }

/* Form */
.form { display: flex; gap: 8px; flex-wrap: wrap; max-width: 520px; }
.form input[type="email"] {
  flex: 1;
  min-width: 200px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-btn);
  padding: 14px 16px;
  font-family: var(--f-sans);
  font-size: 15px;
  color: var(--c-ink);
  background: #fff;
}
.form input[type="email"]::placeholder { color: #94A3B8; }
.form .helper { width: 100%; font-size: 12.5px; color: var(--c-muted); margin-top: 6px; }
.form .helper--error { color: var(--c-accent); }
.form .helper--success { color: var(--c-success); }
.form button[disabled] { opacity: 0.6; cursor: not-allowed; }

.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
```

- [ ] **Step 2: Update `web/src/pages/index.astro` to import the global stylesheet**

```astro
---
import '@/styles/global.css';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Stock Up Dinners</title>
  </head>
  <body>
    <div class="container section">
      <h1>Tokens loaded.</h1>
      <p class="lede">If this paragraph is in Inter and the heading is in Inter 800, fonts work.</p>
      <button class="btn">Test button</button>
    </div>
  </body>
</html>
```

- [ ] **Step 3: Verify the dev server renders fonts and tokens**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: Inter loaded (heading is bold-tight, button is `#0F172A` background). Stop the server (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/src/styles/global.css web/src/pages/index.astro
git commit -m "feat(web): add design tokens and global styles"
```

---

## Task 3: PageShell layout (head, OG metadata, GA4)

**Files:**
- Create: `web/src/layouts/PageShell.astro`

- [ ] **Step 1: Write `web/src/layouts/PageShell.astro`**

```astro
---
import '@/styles/global.css';

export interface Props {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

const {
  title,
  description,
  ogImage = '/og-default.png',
  canonical,
  noindex = false,
} = Astro.props;

const siteUrl = 'https://stockupdinners.com';
const fullTitle = title.includes('Stock Up Dinners') ? title : `${title} — Stock Up Dinners`;
const canonicalUrl = canonical ?? new URL(Astro.url.pathname, siteUrl).toString();
const ogImageAbs = ogImage.startsWith('http') ? ogImage : new URL(ogImage, siteUrl).toString();
const ga4Id = import.meta.env.PUBLIC_GA4_MEASUREMENT_ID;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />
    {noindex && <meta name="robots" content="noindex,nofollow" />}

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate icon" href="/favicon.ico" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImageAbs} />
    <meta property="og:site_name" content="Stock Up Dinners" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImageAbs} />

    {ga4Id && (
      <>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}></script>
        <script is:inline define:vars={{ ga4Id }}>
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', ga4Id, { send_page_view: true });
        </script>
      </>
    )}
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Replace `web/src/pages/index.astro` to use PageShell**

```astro
---
import PageShell from '@/layouts/PageShell.astro';
---
<PageShell
  title="Two cook days. Two weeks of dinner."
  description="A free 14-dinner meal plan for a family of four — built around 75 Costco staples. PDF + printable shopping list."
>
  <div class="container section">
    <h1>PageShell working.</h1>
    <p class="lede">Title in &lt;head&gt;, GA4 tag wired, OG meta set.</p>
  </div>
</PageShell>
```

- [ ] **Step 3: Verify head renders correctly**

```bash
npm run build
grep -E '<title>|og:title|description' dist/index.html
```

Expected output includes `<title>Two cook days. Two weeks of dinner. — Stock Up Dinners</title>`, an `og:title` meta tag, and a `description` meta tag.

- [ ] **Step 4: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/src/layouts/PageShell.astro web/src/pages/index.astro
git commit -m "feat(web): add PageShell layout with OG, canonical, GA4"
```

---

## Task 4: Foundational components (Wordmark, Header, Footer, Section)

**Files:**
- Create: `web/src/components/Wordmark.astro`, `web/src/components/Header.astro`, `web/src/components/Footer.astro`, `web/src/components/Section.astro`

- [ ] **Step 1: Write `web/src/components/Wordmark.astro`**

```astro
---
export interface Props {
  size?: 'sm' | 'md';
}
const { size = 'md' } = Astro.props;
const dim = size === 'sm' ? '14px' : '18px';
const fontSize = size === 'sm' ? '13px' : '14px';
---
<span class="wordmark" style={`font-size:${fontSize}`}>
  <span class="wordmark__mark" style={`width:${dim}; height:${dim}`}></span>
  STOCK UP DINNERS
</span>

<style>
  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--c-ink);
    text-decoration: none;
  }
  .wordmark__mark {
    display: inline-block;
    border-radius: 3px;
    background: var(--c-accent);
  }
</style>
```

- [ ] **Step 2: Write `web/src/components/Header.astro`**

```astro
---
import Wordmark from './Wordmark.astro';
---
<header class="header">
  <div class="container header__inner">
    <a href="/" aria-label="Stock Up Dinners home" class="header__brand">
      <Wordmark />
    </a>
    <a href="/#signup" class="header__cta">Get the free plan</a>
  </div>
</header>

<style>
  .header { border-bottom: 1px solid var(--c-border); background: var(--c-bg); }
  .header__inner { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; }
  .header__brand { text-decoration: none; }
  .header__cta {
    font-size: 13px;
    font-weight: 600;
    color: var(--c-ink);
    text-decoration: none;
    border: 1px solid var(--c-border);
    padding: 8px 14px;
    border-radius: var(--r-btn);
  }
  .header__cta:hover { background: var(--c-bg-tint); }
</style>
```

- [ ] **Step 3: Write `web/src/components/Footer.astro`**

```astro
---
import Wordmark from './Wordmark.astro';
const year = new Date().getFullYear();
---
<footer class="footer">
  <div class="container footer__inner">
    <Wordmark size="sm" />
    <nav class="footer__nav" aria-label="Footer">
      <a href="/about">About</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="mailto:hi@stockupdinners.com">Contact</a>
    </nav>
  </div>
  <div class="container footer__legal">© {year} Stock Up Dinners.</div>
</footer>

<style>
  .footer { border-top: 1px solid var(--c-border); padding: 32px 0 24px; font-size: 13px; color: var(--c-muted); }
  .footer__inner { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
  .footer__nav a { margin-left: 18px; color: var(--c-muted); text-decoration: none; }
  .footer__nav a:first-child { margin-left: 0; }
  .footer__nav a:hover { color: var(--c-ink); }
  .footer__legal { margin-top: 18px; font-size: 12px; color: var(--c-muted); }
</style>
```

- [ ] **Step 4: Write `web/src/components/Section.astro`**

```astro
---
export interface Props {
  tint?: boolean;
  id?: string;
  class?: string;
}
const { tint = false, id, class: cls } = Astro.props;
const classes = ['section', tint ? 'section--tint' : '', cls ?? ''].filter(Boolean).join(' ');
---
<section class={classes} id={id}>
  <div class="container">
    <slot />
  </div>
</section>
```

- [ ] **Step 5: Update `web/src/pages/index.astro` to render Header + Section + Footer for visual smoke**

```astro
---
import PageShell from '@/layouts/PageShell.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import Section from '@/components/Section.astro';
---
<PageShell
  title="Two cook days. Two weeks of dinner."
  description="A free 14-dinner meal plan for a family of four — built around 75 Costco staples. PDF + printable shopping list."
>
  <Header />
  <Section>
    <h1>Foundations wired up.</h1>
    <p class="lede">Header above, footer below. Both share the wordmark component.</p>
  </Section>
  <Section tint>
    <h2>Tinted section</h2>
    <p class="lede">Used for alternating bands — value props, "why this exists", closing CTA.</p>
  </Section>
  <Footer />
</PageShell>
```

- [ ] **Step 6: Verify visually**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: header with red-square wordmark + "Get the free plan" anchor, tinted middle band, footer with About/Privacy/Terms/Contact. Stop the server.

- [ ] **Step 7: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/src/components/ web/src/pages/index.astro
git commit -m "feat(web): add Wordmark, Header, Footer, Section components"
```

---

## Task 5: UTM extraction utility (TDD)

**Files:**
- Create: `web/vitest.config.ts`, `web/tests/unit/utm.test.ts`, `web/src/scripts/utm.ts`

- [ ] **Step 1: Install Vitest and happy-dom**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm install --save-dev vitest@^2.1.0 happy-dom@^15.0.0
```

- [ ] **Step 2: Write `web/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Write the failing test in `web/tests/unit/utm.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { extractUtmParams, UTM_KEYS } from '@/scripts/utm';

describe('extractUtmParams', () => {
  it('returns all 5 standard utm keys when present', () => {
    const url = 'https://stockupdinners.com/?utm_source=pinterest&utm_medium=pin&utm_campaign=launch&utm_term=costco&utm_content=v1';
    expect(extractUtmParams(url)).toEqual({
      utm_source: 'pinterest',
      utm_medium: 'pin',
      utm_campaign: 'launch',
      utm_term: 'costco',
      utm_content: 'v1',
    });
  });

  it('omits keys that are not present', () => {
    const url = 'https://stockupdinners.com/?utm_source=reddit&utm_medium=comment';
    expect(extractUtmParams(url)).toEqual({
      utm_source: 'reddit',
      utm_medium: 'comment',
    });
  });

  it('returns empty object when no utm params', () => {
    expect(extractUtmParams('https://stockupdinners.com/')).toEqual({});
  });

  it('ignores non-utm query params', () => {
    const url = 'https://stockupdinners.com/?ref=foo&utm_source=facebook';
    expect(extractUtmParams(url)).toEqual({ utm_source: 'facebook' });
  });

  it('exports the canonical 5-key list', () => {
    expect(UTM_KEYS).toEqual([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ]);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

```bash
npm run test
```

Expected: FAIL — `Failed to resolve import "@/scripts/utm"`.

- [ ] **Step 5: Write minimal implementation in `web/src/scripts/utm.ts`**

```ts
export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export type UtmKey = typeof UTM_KEYS[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

export function extractUtmParams(urlOrSearch: string): UtmParams {
  let params: URLSearchParams;
  try {
    params = new URL(urlOrSearch).searchParams;
  } catch {
    params = new URLSearchParams(urlOrSearch.startsWith('?') ? urlOrSearch.slice(1) : urlOrSearch);
  }
  const out: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value !== null && value !== '') out[key] = value;
  }
  return out;
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test
```

Expected: PASS — 5/5 tests green.

- [ ] **Step 7: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/vitest.config.ts web/tests/unit/utm.test.ts web/src/scripts/utm.ts web/package.json web/package-lock.json
git commit -m "feat(web): add UTM extraction utility with tests"
```

---

## Task 6: Analytics helper

**Files:**
- Create: `web/src/scripts/analytics.ts`

This is a thin typed wrapper around `window.gtag` so the rest of the code doesn't sprinkle `as any` casts. No tests — it's a one-liner that delegates to a global the browser provides; testing it would just mirror the implementation.

- [ ] **Step 1: Write `web/src/scripts/analytics.ts`**

```ts
type GtagArgs = [
  command: 'event' | 'config' | 'set' | 'js',
  ...rest: unknown[]
];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | 'signup_attempt'
  | 'signup_complete'
  | 'signup_error'
  | 'pdf_link_click';

export function track(event: AnalyticsEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}
```

- [ ] **Step 2: Type-check passes**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/src/scripts/analytics.ts
git commit -m "feat(web): add typed gtag wrapper"
```

---

## Task 7: SignupForm script (TDD)

This is the most logic-heavy module — TDD it carefully. The script takes a form element + a deps object (fetch, navigate, track) so everything is mockable.

**Files:**
- Create: `web/tests/unit/signup.test.ts`, `web/src/scripts/signup.ts`

- [ ] **Step 1: Write the failing test in `web/tests/unit/signup.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attachSignupForm, type SignupDeps } from '@/scripts/signup';

function buildForm(extraInputs: Record<string, string> = {}): HTMLFormElement {
  const form = document.createElement('form');
  form.setAttribute('data-signup-form', '');

  const email = document.createElement('input');
  email.type = 'email';
  email.name = 'email';
  email.required = true;
  form.appendChild(email);

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Send the plan';
  form.appendChild(button);

  const helper = document.createElement('p');
  helper.className = 'helper';
  helper.setAttribute('data-helper', '');
  helper.textContent = 'No spam.';
  form.appendChild(helper);

  for (const [k, v] of Object.entries(extraInputs)) {
    const i = document.createElement('input');
    i.type = 'hidden';
    i.name = k;
    i.value = v;
    form.appendChild(i);
  }

  document.body.appendChild(form);
  return form;
}

function buildDeps(overrides: Partial<SignupDeps> = {}): SignupDeps {
  return {
    fetch: vi.fn(async () => new Response(null, { status: 200 })),
    navigate: vi.fn(),
    track: vi.fn(),
    getUtm: () => ({}),
    subscribeUrl: 'https://app.beehiiv.com/form_submissions/test-form-id',
    redirectDelayMs: 0,
    ...overrides,
  };
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe('attachSignupForm', () => {
  it('POSTs email to the subscribe URL and navigates to /thanks on success', async () => {
    const form = buildForm();
    const deps = buildDeps();
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'a@b.co';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(r => setTimeout(r, 0));

    expect(deps.fetch).toHaveBeenCalledOnce();
    const [url, init] = (deps.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://app.beehiiv.com/form_submissions/test-form-id');
    expect(init.method).toBe('POST');
    const body = init.body as URLSearchParams;
    expect(body.get('email')).toBe('a@b.co');

    expect(deps.track).toHaveBeenCalledWith('signup_attempt', expect.any(Object));
    expect(deps.track).toHaveBeenCalledWith('signup_complete', expect.any(Object));
    expect(deps.navigate).toHaveBeenCalledWith('/thanks');
  });

  it('forwards UTM params in the POST body', async () => {
    const form = buildForm();
    const deps = buildDeps({
      getUtm: () => ({ utm_source: 'pinterest', utm_medium: 'pin' }),
    });
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'x@y.co';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    const init = (deps.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const body = init.body as URLSearchParams;
    expect(body.get('utm_source')).toBe('pinterest');
    expect(body.get('utm_medium')).toBe('pin');
  });

  it('shows error helper text and re-enables the button on fetch failure', async () => {
    const form = buildForm();
    const deps = buildDeps({
      fetch: vi.fn(async () => new Response(null, { status: 500 })),
    });
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'a@b.co';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(deps.track).toHaveBeenCalledWith('signup_error', expect.any(Object));
    expect(deps.navigate).not.toHaveBeenCalled();
    const helper = form.querySelector('[data-helper]') as HTMLElement;
    expect(helper.classList.contains('helper--error')).toBe(true);
    const button = form.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('shows error and skips fetch on invalid email', async () => {
    const form = buildForm();
    const deps = buildDeps();
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'not-an-email';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(deps.fetch).not.toHaveBeenCalled();
    const helper = form.querySelector('[data-helper]') as HTMLElement;
    expect(helper.classList.contains('helper--error')).toBe(true);
  });

  it('disables the button while submitting and re-enables on completion', async () => {
    const form = buildForm();
    let resolveFetch: (r: Response) => void = () => {};
    const fetchPromise = new Promise<Response>(r => { resolveFetch = r; });
    const deps = buildDeps({ fetch: vi.fn(() => fetchPromise) });
    attachSignupForm(form, deps);

    (form.querySelector('input[type=email]') as HTMLInputElement).value = 'a@b.co';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();

    const button = form.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    resolveFetch(new Response(null, { status: 200 }));
    await new Promise(r => setTimeout(r, 0));
    expect(button.disabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm run test
```

Expected: FAIL — `Failed to resolve import "@/scripts/signup"`.

- [ ] **Step 3: Implement `web/src/scripts/signup.ts`**

```ts
import type { UtmParams } from './utm';
import type { AnalyticsEvent } from './analytics';

export interface SignupDeps {
  fetch: typeof fetch;
  navigate: (url: string) => void;
  track: (event: AnalyticsEvent, params?: Record<string, unknown>) => void;
  getUtm: () => UtmParams;
  subscribeUrl: string;
  redirectDelayMs?: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function attachSignupForm(form: HTMLFormElement, deps: SignupDeps): void {
  const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])');
  const helper = form.querySelector<HTMLElement>('[data-helper]');

  if (!emailInput || !button) return;

  const originalHelperText = helper?.textContent ?? '';
  const originalButtonText = button.textContent ?? 'Send the plan';
  const redirectDelayMs = deps.redirectDelayMs ?? 800;

  const setHelper = (text: string, kind: 'idle' | 'error' | 'success') => {
    if (!helper) return;
    helper.textContent = text;
    helper.classList.remove('helper--error', 'helper--success');
    if (kind === 'error') helper.classList.add('helper--error');
    if (kind === 'success') helper.classList.add('helper--success');
  };

  const resetHelper = () => setHelper(originalHelperText, 'idle');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!EMAIL_RE.test(email)) {
      setHelper('Please enter a valid email address.', 'error');
      return;
    }

    resetHelper();
    button.disabled = true;
    button.textContent = 'Sending…';
    deps.track('signup_attempt', { source: 'web' });

    try {
      const body = new URLSearchParams();
      body.set('email', email);
      const utm = deps.getUtm();
      for (const [k, v] of Object.entries(utm)) {
        if (v) body.set(k, v);
      }

      const res = await deps.fetch(deps.subscribeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      deps.track('signup_complete', { ...utm });
      setHelper('Got it — check your email.', 'success');
      button.textContent = 'Sent ✓';

      setTimeout(() => deps.navigate('/thanks'), redirectDelayMs);
    } catch (err) {
      deps.track('signup_error', { message: String(err) });
      setHelper('Something went wrong. Try again or email hi@stockupdinners.com.', 'error');
      button.disabled = false;
      button.textContent = originalButtonText;
    }
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test
```

Expected: PASS — all 5 signup tests + the existing 5 utm tests = 10 total.

- [ ] **Step 5: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/tests/unit/signup.test.ts web/src/scripts/signup.ts
git commit -m "feat(web): add signup form script with tests"
```

---

## Task 8: SignupForm Astro component

**Files:**
- Create: `web/src/components/SignupForm.astro`

- [ ] **Step 1: Write `web/src/components/SignupForm.astro`**

```astro
---
export interface Props {
  variant?: 'hero' | 'closing';
  helper?: string;
  buttonLabel?: string;
}
const {
  variant = 'hero',
  helper = 'Free PDF + printable shopping list. No spam — unsubscribe anytime.',
  buttonLabel = 'Send the plan',
} = Astro.props;

const formId = variant === 'hero' ? 'signup' : `signup-${variant}`;
---
<form class="form" id={formId} data-signup-form novalidate>
  <label class="sr-only" for={`${formId}-email`}>Email address</label>
  <input
    id={`${formId}-email`}
    name="email"
    type="email"
    placeholder="you@example.com"
    autocomplete="email"
    required
  />
  <button type="submit">{buttonLabel}</button>
  <p class="helper" data-helper>{helper}</p>
</form>

<script>
  import { attachSignupForm } from '@/scripts/signup';
  import { extractUtmParams } from '@/scripts/utm';
  import { track } from '@/scripts/analytics';

  const subscribeUrl = import.meta.env.PUBLIC_BEEHIIV_SUBSCRIBE_URL;

  document.querySelectorAll<HTMLFormElement>('form[data-signup-form]').forEach((form) => {
    if (!subscribeUrl) {
      console.warn('[signup] PUBLIC_BEEHIIV_SUBSCRIBE_URL not set — form will no-op.');
    }
    attachSignupForm(form, {
      fetch: window.fetch.bind(window),
      navigate: (url) => window.location.assign(url),
      track,
      getUtm: () => extractUtmParams(window.location.search),
      subscribeUrl: subscribeUrl ?? '',
    });
  });
</script>
```

- [ ] **Step 2: Render SignupForm in index.astro to smoke test**

Replace the current contents of `web/src/pages/index.astro`:

```astro
---
import PageShell from '@/layouts/PageShell.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import Section from '@/components/Section.astro';
import SignupForm from '@/components/SignupForm.astro';
---
<PageShell
  title="Two cook days. Two weeks of dinner."
  description="A free 14-dinner meal plan for a family of four — built around 75 Costco staples. PDF + printable shopping list."
>
  <Header />
  <Section>
    <h1>SignupForm smoke test</h1>
    <p class="lede" style="margin-bottom: 24px;">Submit with an invalid email — should show inline error. Submit with a valid email when env is unset — should also error gracefully.</p>
    <SignupForm />
  </Section>
  <Footer />
</PageShell>
```

- [ ] **Step 3: Smoke test the form behavior**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm run dev
```

In browser:
1. Submit with `not-an-email` → expect inline red helper text "Please enter a valid email address."
2. Submit with `valid@example.com` → button changes to "Sending…", then helper turns red "Something went wrong…" (because `PUBLIC_BEEHIIV_SUBSCRIBE_URL` is empty in the dev env — this is the expected dev-mode failure path).

Stop the server.

- [ ] **Step 4: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/src/components/SignupForm.astro web/src/pages/index.astro
git commit -m "feat(web): add SignupForm Astro component"
```

---

## Task 9: Hero, ValueProps, MealGridPreview, PDFCoverMock, FAQ components

**Files:**
- Create: `web/src/components/Hero.astro`, `web/src/components/ValueProps.astro`, `web/src/components/MealGridPreview.astro`, `web/src/components/PDFCoverMock.astro`, `web/src/components/FAQ.astro`

- [ ] **Step 1: Write `web/src/components/MealGridPreview.astro`**

```astro
---
export interface Props {
  meals?: Array<{ ix: string; name: string }>;
  cols?: number;
}
const defaultMeals = [
  { ix: '01', name: 'Chicken Burrito Bowls' },
  { ix: '02', name: 'Beef Bolognese' },
  { ix: '03', name: 'Teriyaki Salmon' },
  { ix: '04', name: 'Veggie Stir-Fry' },
  { ix: '05', name: 'Turkey Chili' },
  { ix: '06', name: 'Coconut Shrimp' },
  { ix: '07', name: 'Baked Penne' },
  { ix: '08', name: 'Chicken Tikka' },
];
const { meals = defaultMeals, cols = 4 } = Astro.props;
---
<ul class="grid" style={`--cols:${cols}`}>
  {meals.map((m) => (
    <li class="cell">
      <span class="ix">{m.ix}</span>{m.name}
    </li>
  ))}
</ul>

<style>
  .grid {
    list-style: none;
    margin: 40px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 6px;
    max-width: 760px;
  }
  .cell {
    background: #fff;
    border: 1px solid var(--c-border);
    border-radius: 5px;
    padding: 10px 12px;
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--c-ink);
  }
  .cell .ix { color: #94A3B8; margin-right: 6px; }
  @media (max-width: 780px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
```

- [ ] **Step 2: Write `web/src/components/Hero.astro`**

```astro
---
import SignupForm from './SignupForm.astro';
import MealGridPreview from './MealGridPreview.astro';
---
<div class="hero">
  <p class="hero__meta">14&nbsp;DINNERS &nbsp;·&nbsp; 2&nbsp;COOK_DAYS &nbsp;·&nbsp; 1&nbsp;COSTCO_LIST</p>
  <h1>Two cook days.<br/>Two weeks of dinner.</h1>
  <p class="hero__sub">
    A free 14-dinner meal plan for a family of four — built around 75 Costco staples.
    Print the shopping list, do one warehouse run, batch-cook on Sunday. Reheat the rest of the week.
  </p>
  <SignupForm variant="hero" />
  <MealGridPreview />
</div>

<style>
  .hero { padding-top: 8px; }
  .hero__meta {
    font-family: var(--f-mono);
    font-size: 11px;
    color: var(--c-muted);
    letter-spacing: 0.08em;
    margin: 0 0 18px;
  }
  .hero__sub {
    font-size: 18px;
    color: var(--c-body);
    line-height: 1.55;
    max-width: 580px;
    margin: 18px 0 28px;
  }
  @media (max-width: 780px) {
    .hero__sub { font-size: 16px; }
  }
</style>
```

- [ ] **Step 3: Write `web/src/components/ValueProps.astro`**

```astro
---
const props = [
  {
    num: '01',
    title: '14 dinners, ready to go',
    body: 'Family-of-four portions, mapped across two weeks. Real recipes — burrito bowls, bolognese, curry — not protein-and-rice on repeat.',
  },
  {
    num: '02',
    title: '2 cook days a week',
    body: 'Sunday batch + a midweek mini. Storage and reheat instructions for every meal, so dinner is microwave-fast on weeknights.',
  },
  {
    num: '03',
    title: '1 consolidated Costco list',
    body: 'Deduplicated, quantified for a family of four, organized by warehouse aisle. Walk in, walk out, done.',
  },
];
---
<div class="vp-grid">
  {props.map((p) => (
    <div class="vp-card">
      <div class="num">{p.num}</div>
      <h4>{p.title}</h4>
      <p>{p.body}</p>
    </div>
  ))}
</div>

<style>
  .vp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 32px; }
  .vp-card { border: 1px solid var(--c-border); border-radius: var(--r-card); padding: 22px; background: #fff; }
  .vp-card .num { font-family: var(--f-mono); font-size: 11px; color: var(--c-muted); }
  .vp-card h4 { margin: 6px 0 8px; font-size: 20px; font-weight: 800; letter-spacing: -0.015em; }
  .vp-card p { font-size: 14px; color: var(--c-body); line-height: 1.55; }
  @media (max-width: 780px) {
    .vp-grid { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 4: Write `web/src/components/PDFCoverMock.astro`**

```astro
---
---
<div class="pdf-cover" aria-label="Free PDF preview">
  <div class="pdf-mark">STOCK UP DINNERS · CYCLE 1</div>
  <div class="pdf-title">14 dinners.<br/>2 weeks. 1 list.</div>
  <div class="pdf-sub">Family-of-four meal plan, Costco-anchored.</div>
  <div class="pdf-divider"></div>
  <div class="pdf-list">
    01 &nbsp; CHICKEN BURRITO BOWLS<br/>
    02 &nbsp; BEEF BOLOGNESE<br/>
    03 &nbsp; TERIYAKI SALMON<br/>
    04 &nbsp; VEGGIE STIR-FRY<br/>
    05 &nbsp; TURKEY CHILI<br/>
    06 &nbsp; COCONUT SHRIMP CURRY<br/>
    07 &nbsp; BAKED PENNE BOLOGNESE<br/>
    <span class="dim">··· + 7 MORE</span>
  </div>
  <div class="pdf-foot">stockupdinners.com</div>
</div>

<style>
  .pdf-cover {
    background: #fff;
    border: 1px solid var(--c-border);
    border-radius: var(--r-card);
    padding: 30px;
    aspect-ratio: 8.5/11;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .pdf-mark { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.18em; color: var(--c-muted); }
  .pdf-title { font-size: 30px; font-weight: 800; line-height: 1.05; letter-spacing: -0.025em; color: var(--c-ink); }
  .pdf-sub { font-size: 13px; color: var(--c-body); line-height: 1.55; }
  .pdf-divider { height: 1px; background: var(--c-border); margin: 8px 0; }
  .pdf-list { font-family: var(--f-mono); font-size: 11px; color: var(--c-ink); line-height: 1.85; }
  .pdf-list .dim { color: #94A3B8; }
  .pdf-foot { margin-top: auto; font-size: 11px; color: var(--c-muted); }
</style>
```

- [ ] **Step 5: Write `web/src/components/FAQ.astro`**

```astro
---
const faqs = [
  {
    q: 'Do I have to shop at Costco?',
    a: 'The plan is built around 75 Costco staples — pack sizes, quantities, and price expectations all assume Costco. You can substitute equivalents from any warehouse club or large grocery store, but the shopping list won\'t map 1:1.',
  },
  {
    q: 'Will the recipes work for picky kids?',
    a: 'Most of them, yes. The plan leans on familiar shapes — burrito bowls, pasta, stir-fry, chili — with simple seasoning. The PDF includes notes on ingredients to swap or skip when you\'ve got a picky eater at the table.',
  },
  {
    q: 'How long does each cook day take?',
    a: 'Cook Day 1 is roughly 3–4 hours of active time on a Sunday afternoon, batching 7 meals. Cook Day 2 is a 60–90 minute mid-week mini, batching the next 7. Reheats are 5–15 minutes on weeknights.',
  },
  {
    q: 'What if I\'m cooking for 2 instead of 4?',
    a: 'Halve the protein and starch quantities; produce and condiments are usually fine to keep at full quantity since Costco pack sizes are generous. The free plan doesn\'t include scaled-down lists — that\'s on the roadmap for the paid 6-week system.',
  },
  {
    q: 'Is there a paid version?',
    a: 'Yes — a $25 PDF with the full 6-week system (the free 14 dinners plus three more bi-weekly plans = 26 dinners total, with rolling weekly rhythm and pantry-drawdown logic). You\'ll hear about it in the welcome email sequence.',
  },
  {
    q: 'Will you spam me?',
    a: 'No. The welcome sequence is three emails over a week, then occasional updates when new bi-weekly plans drop. Unsubscribe with one click any time.',
  },
];
---
<div class="faq">
  {faqs.map((f) => (
    <details class="faq__row">
      <summary class="faq__q">
        <span>{f.q}</span>
        <span class="faq__chev" aria-hidden="true">+</span>
      </summary>
      <div class="faq__a">{f.a}</div>
    </details>
  ))}
</div>

<style>
  .faq { display: flex; flex-direction: column; gap: 8px; margin-top: 28px; }
  .faq__row { border: 1px solid var(--c-border); border-radius: var(--r-card); padding: 18px 22px; background: #fff; }
  .faq__q { font-weight: 600; font-size: 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; list-style: none; color: var(--c-ink); }
  .faq__q::-webkit-details-marker { display: none; }
  .faq__chev { color: #94A3B8; font-family: var(--f-mono); transition: transform 120ms ease; }
  .faq__row[open] .faq__chev { transform: rotate(45deg); }
  .faq__a { margin-top: 10px; font-size: 14px; color: var(--c-body); line-height: 1.6; }
</style>
```

- [ ] **Step 6: Type-check**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/src/components/
git commit -m "feat(web): add Hero, ValueProps, MealGridPreview, PDFCoverMock, FAQ components"
```

---

## Task 10: Compose the homepage (`/`)

**Files:**
- Modify: `web/src/pages/index.astro`

- [ ] **Step 1: Replace `web/src/pages/index.astro` with the full composition**

```astro
---
import PageShell from '@/layouts/PageShell.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import Section from '@/components/Section.astro';
import Hero from '@/components/Hero.astro';
import ValueProps from '@/components/ValueProps.astro';
import PDFCoverMock from '@/components/PDFCoverMock.astro';
import FAQ from '@/components/FAQ.astro';
import SignupForm from '@/components/SignupForm.astro';
---
<PageShell
  title="Two cook days. Two weeks of dinner."
  description="A free 14-dinner meal plan for a family of four — built around 75 Costco staples. PDF + printable shopping list."
>
  <Header />

  <Section>
    <Hero />
  </Section>

  <Section tint>
    <p class="eyebrow">How it works</p>
    <h2>Designed to fit your week, not consume it.</h2>
    <p class="lede">No daily cooking. No mid-week grocery runs. One Costco trip, two batch sessions, fourteen dinners ready to reheat.</p>
    <ValueProps />
  </Section>

  <Section>
    <p class="eyebrow">Inside the free PDF</p>
    <h2>A full system, not a recipe roundup.</h2>
    <div class="pdf-row">
      <PDFCoverMock />
      <div class="pdf-meta">
        <h3>What's actually in the file</h3>
        <ul>
          <li><strong>14 dinners with full recipes.</strong> Ingredients, quantities, instructions, storage notes.</li>
          <li><strong>2 consolidated shopping lists.</strong> Costco-aisle organized. Printable. Quantified.</li>
          <li><strong>Cook day workflows.</strong> Step-by-step for Cook Day 1 + Cook Day 2 — what goes in the oven first, what's prepped while it's roasting.</li>
          <li><strong>Storage + reheat cheat sheet.</strong> Foil pan vs freezer bag, oven vs microwave, exact times.</li>
          <li><strong>The 75-staple list.</strong> The Costco shortlist this whole system runs on.</li>
        </ul>
      </div>
    </div>
  </Section>

  <Section tint>
    <div class="why">
      <div>
        <p class="eyebrow" style="color: var(--c-muted)">Why this exists</p>
        <h2>Built because nothing else worked.</h2>
      </div>
      <div class="why__body">
        <p>Most meal-plan products either ignore Costco entirely or assume you've got time for daily prep. This one is the opposite: it accepts that your kitchen runs on warehouse-club staples and that real life is two cook windows, not seven.</p>
        <p>Free fourteen-day plan now. The full six-week system, with three more bi-weekly plans, lands later. <a href="/about" class="why__link">More about the project →</a></p>
      </div>
    </div>
  </Section>

  <Section>
    <div class="faq-wrap">
      <p class="eyebrow">Common questions</p>
      <h2>FAQ</h2>
      <FAQ />
    </div>
  </Section>

  <Section tint>
    <div class="closing">
      <h2>Get the free 14-dinner plan.</h2>
      <p class="lede">PDF + printable shopping list, in your inbox in under a minute.</p>
      <SignupForm variant="closing" helper="Free PDF + printable shopping list. No spam." />
    </div>
  </Section>

  <Footer />
</PageShell>

<style>
  .pdf-row { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 32px; align-items: start; margin-top: 32px; }
  .pdf-meta h3 { font-size: 22px; font-weight: 800; letter-spacing: -0.015em; margin: 0 0 10px; }
  .pdf-meta ul { margin: 0; padding: 0; list-style: none; }
  .pdf-meta li { padding: 12px 0; border-bottom: 1px solid var(--c-border); font-size: 14px; color: var(--c-body); line-height: 1.55; }
  .pdf-meta li:last-child { border-bottom: none; }
  .pdf-meta li strong { color: var(--c-ink); font-weight: 700; }

  .why { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
  .why__body p { font-size: 15.5px; color: var(--c-body); line-height: 1.65; margin-bottom: 14px; }
  .why__link { font-size: 13.5px; font-weight: 600; color: var(--c-ink); border-bottom: 1.5px solid var(--c-accent); padding-bottom: 1px; text-decoration: none; }

  .faq-wrap { max-width: 760px; }
  .closing { text-align: center; }
  .closing :global(.form) { margin: 16px auto 0; justify-content: center; }

  @media (max-width: 780px) {
    .pdf-row, .why { grid-template-columns: 1fr; gap: 24px; }
  }
</style>
```

- [ ] **Step 2: Verify the homepage renders end-to-end**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm run dev
```

Open `http://localhost:4321`. Scroll the page. Verify all sections present, mobile responsive (resize to 375px), no console errors. Stop the server.

- [ ] **Step 3: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/src/pages/index.astro
git commit -m "feat(web): compose homepage with all sections"
```

---

## Task 11: Supporting pages (`/thanks`, `/about`, `/privacy`, `/terms`, `/404`)

**Files:**
- Create: `web/src/pages/thanks.astro`, `web/src/pages/about.astro`, `web/src/pages/privacy.astro`, `web/src/pages/terms.astro`, `web/src/pages/404.astro`

- [ ] **Step 1: Write `web/src/pages/thanks.astro`**

```astro
---
import PageShell from '@/layouts/PageShell.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import Section from '@/components/Section.astro';
import SignupForm from '@/components/SignupForm.astro';
---
<PageShell
  title="Check your email"
  description="The Stock Up Dinners free 14-dinner meal plan is on its way."
  noindex
>
  <Header />
  <Section>
    <p class="eyebrow">Almost there</p>
    <h1>Check your email.</h1>
    <p class="lede">The PDF is on its way — should arrive within a minute. If you don't see it, check spam or promotions.</p>

    <div class="recapture">
      <h3>Didn't get it? Try again.</h3>
      <p class="lede" style="margin-top:8px">Typos happen. Re-enter your email and we'll resend.</p>
      <SignupForm variant="closing" helper="Resend the welcome email + PDF." buttonLabel="Resend" />
    </div>

    <p class="lede" style="margin-top:48px">
      <a href="/" style="color:var(--c-ink); border-bottom:1.5px solid var(--c-accent); text-decoration:none; padding-bottom:1px;">← Back to the home page</a>
    </p>
  </Section>
  <Footer />
</PageShell>

<style>
  .recapture { margin-top: 48px; padding: 24px; border: 1px solid var(--c-border); border-radius: var(--r-card); background: var(--c-bg-tint); max-width: 560px; }
  .recapture h3 { font-size: 16px; font-weight: 700; margin: 0; }
</style>
```

- [ ] **Step 2: Write `web/src/pages/about.astro`**

```astro
---
import PageShell from '@/layouts/PageShell.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import Section from '@/components/Section.astro';
import SignupForm from '@/components/SignupForm.astro';
---
<PageShell
  title="About"
  description="Why Stock Up Dinners exists, and who's behind it."
>
  <Header />
  <Section>
    <p class="eyebrow">About</p>
    <h1>The kitchen runs on Costco. The plan should too.</h1>
    <div class="prose">
      <p>Stock Up Dinners started as a personal experiment: could a family of four eat real, varied dinners every weeknight without grocery-shopping more than once every two weeks? After two years of iterating on what we cooked, when, and what went in the cart, the answer turned out to be yes — but only with a system.</p>
      <p>The system is built around 75 Costco staples that don't go bad fast and that combine into a wide enough range of dinners to keep the table interesting. Two batch-cook sessions per fortnight do the heavy lifting; weeknights are reheats. The free 14-dinner plan is the first cycle of that system, exactly the way it runs in our kitchen.</p>
      <p>The full six-week version (with three more bi-weekly plans, pantry-drawdown logic, and a rolling weekly rhythm) is available as a $25 PDF for anyone who wants to commit to the whole thing. There's also a companion app in the works that turns the system into something you can tap your way through instead of printing.</p>
      <p>Built by a one-person team. No VC, no ads, no algorithm-chasing. The newsletter is the product distribution channel — sign up below if you want the free plan.</p>
    </div>
    <div style="margin-top:40px">
      <SignupForm variant="hero" />
    </div>
  </Section>
  <Footer />
</PageShell>

<style>
  .prose { max-width: 640px; margin-top: 24px; }
  .prose p { font-size: 16.5px; color: var(--c-body); line-height: 1.7; margin-bottom: 18px; }
</style>
```

- [ ] **Step 3: Write `web/src/pages/privacy.astro`**

```astro
---
import PageShell from '@/layouts/PageShell.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import Section from '@/components/Section.astro';
const updated = '2026-04-28';
---
<PageShell title="Privacy policy" description="How Stock Up Dinners handles your data.">
  <Header />
  <Section>
    <p class="eyebrow">Last updated {updated}</p>
    <h1>Privacy policy</h1>
    <div class="prose">
      <h3>What we collect</h3>
      <p>When you sign up for the free meal plan, we collect your email address and any UTM parameters present in the URL at the time of sign-up (so we can understand which channels work). That's it — no name, no phone, no payment info, no demographic data.</p>

      <h3>Where it lives</h3>
      <p>Email addresses are stored in <a href="https://www.beehiiv.com/privacy" target="_blank" rel="noopener">Beehiiv</a>, our newsletter platform. Beehiiv hosts the welcome sequence and any future newsletter content.</p>

      <h3>Analytics</h3>
      <p>We use Google Analytics 4 to measure traffic, signup conversion, and channel attribution. GA4 sets cookies that may identify your browser; it does not collect personally identifying information like your email address.</p>

      <h3>Sharing</h3>
      <p>We don't sell, rent, or share your email with third parties. Beehiiv processes it on our behalf as our email service provider; that's the only sharing that happens.</p>

      <h3>Unsubscribing &amp; deletion</h3>
      <p>Every email we send includes a one-click unsubscribe. Unsubscribing removes you from the active list. To request full deletion of your record from Beehiiv, email <a href="mailto:hi@stockupdinners.com">hi@stockupdinners.com</a> and we'll handle it within 7 days.</p>

      <h3>Contact</h3>
      <p>Questions? <a href="mailto:hi@stockupdinners.com">hi@stockupdinners.com</a>.</p>
    </div>
  </Section>
  <Footer />
</PageShell>

<style>
  .prose { max-width: 720px; margin-top: 24px; }
  .prose h3 { font-size: 18px; font-weight: 700; margin: 28px 0 8px; }
  .prose p { font-size: 15.5px; color: var(--c-body); line-height: 1.65; margin-bottom: 12px; }
  .prose a { color: var(--c-ink); border-bottom: 1px solid var(--c-accent); }
</style>
```

- [ ] **Step 4: Write `web/src/pages/terms.astro`**

```astro
---
import PageShell from '@/layouts/PageShell.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import Section from '@/components/Section.astro';
const updated = '2026-04-28';
---
<PageShell title="Terms of use" description="Terms governing use of the Stock Up Dinners site and content.">
  <Header />
  <Section>
    <p class="eyebrow">Last updated {updated}</p>
    <h1>Terms of use</h1>
    <div class="prose">
      <h3>Acceptable use</h3>
      <p>You're welcome to use this site, sign up for the newsletter, download the free PDF, and follow the recipes for personal household use.</p>

      <h3>Content ownership</h3>
      <p>The recipes, meal plans, copy, and design on this site are the original work of Stock Up Dinners. Don't republish, resell, or redistribute the PDFs or page content. Sharing the link is great. Copy-pasting the contents to your own site or selling them is not.</p>

      <h3>No warranties</h3>
      <p>The meal plans are provided as-is. Cost estimates, cook times, and ingredient availability are best-efforts but not guaranteed — Costco inventory varies by region. Check ingredient labels for allergens. We're not liable for kitchen mishaps, supply substitutions, or picky eaters.</p>

      <h3>Changes</h3>
      <p>These terms may be updated as the project evolves. Substantive changes will be reflected in the "last updated" date above.</p>

      <h3>Contact</h3>
      <p>Questions? <a href="mailto:hi@stockupdinners.com">hi@stockupdinners.com</a>.</p>
    </div>
  </Section>
  <Footer />
</PageShell>

<style>
  .prose { max-width: 720px; margin-top: 24px; }
  .prose h3 { font-size: 18px; font-weight: 700; margin: 28px 0 8px; }
  .prose p { font-size: 15.5px; color: var(--c-body); line-height: 1.65; margin-bottom: 12px; }
  .prose a { color: var(--c-ink); border-bottom: 1px solid var(--c-accent); }
</style>
```

- [ ] **Step 5: Write `web/src/pages/404.astro`**

```astro
---
import PageShell from '@/layouts/PageShell.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import Section from '@/components/Section.astro';
---
<PageShell title="Not found" description="That page doesn't exist." noindex>
  <Header />
  <Section>
    <p class="eyebrow">404</p>
    <h1>That page isn't on the menu.</h1>
    <p class="lede">The link you followed is broken or the page has moved.</p>
    <p style="margin-top:32px">
      <a href="/" class="btn">Back to the home page</a>
    </p>
  </Section>
  <Footer />
</PageShell>
```

- [ ] **Step 6: Build and verify all 6 pages render**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm run build
ls -la dist/
```

Expected files in `dist/`: `index.html`, `thanks/index.html`, `about/index.html`, `privacy/index.html`, `terms/index.html`, `404.html`.

- [ ] **Step 7: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/src/pages/
git commit -m "feat(web): add /thanks, /about, /privacy, /terms, /404 pages"
```

---

## Task 12: SEO essentials (sitemap, robots, favicon, OG image)

**Files:**
- Create: `web/public/robots.txt`, `web/public/favicon.svg`, `web/public/og-default.png` (placeholder), `web/scripts/make-placeholder-og.mjs`

- [ ] **Step 1: Write `web/public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://stockupdinners.com/sitemap-index.xml
```

(Astro's `@astrojs/sitemap` integration emits `sitemap-index.xml` as the entry point.)

- [ ] **Step 2: Write `web/public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0F172A"/>
  <rect x="9" y="9" width="14" height="14" rx="2" fill="#DC2626"/>
</svg>
```

- [ ] **Step 3: Write the OG-image generator script at `web/scripts/make-placeholder-og.mjs`**

```js
import { createCanvas } from 'canvas';
import { writeFileSync } from 'node:fs';

const W = 1200, H = 630;

const c = createCanvas(W, H);
const ctx = c.getContext('2d');
ctx.fillStyle = '#0F172A';
ctx.fillRect(0, 0, W, H);
ctx.fillStyle = '#DC2626';
ctx.fillRect(80, 80, 56, 56);
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 96px system-ui, sans-serif';
ctx.fillText('STOCK UP DINNERS', 80, 360);
ctx.font = '42px system-ui, sans-serif';
ctx.fillStyle = '#94A3B8';
ctx.fillText('14 dinners. 2 cook days. 1 Costco list.', 80, 420);
writeFileSync('public/og-default.png', c.toBuffer('image/png'));
console.log('Wrote public/og-default.png');
```

- [ ] **Step 4: Generate the placeholder PNG**

```bash
cd /Users/robertwarren/stock-up-dinners/web
mkdir -p scripts
# (write the script file in step 3 first)
npm install --no-save canvas@^2.11.2
node scripts/make-placeholder-og.mjs
ls -lh public/og-default.png
```

Expected: `og-default.png` exists, ~5–30 KB.

If `canvas` install fails on this system (it has native deps requiring Cairo/Pango), the fallback is to drop any valid 1200×630 PNG into `web/public/og-default.png` manually — the file just needs to exist for OG meta tags to resolve.

- [ ] **Step 5: Verify sitemap is generated by build**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm run build
ls dist/ | grep -E 'sitemap|robots'
```

Expected output includes `sitemap-index.xml`, `sitemap-0.xml`, and `robots.txt`.

- [ ] **Step 6: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/public/ web/scripts/
git commit -m "feat(web): add favicon, robots, OG placeholder, sitemap config"
```

---

## Task 13: E2E tests (Playwright)

**Files:**
- Create: `web/playwright.config.ts`, `web/tests/e2e/smoke.spec.ts`, `web/tests/e2e/signup.spec.ts`

- [ ] **Step 1: Install Playwright**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm install --save-dev @playwright/test@^1.48.0
npx playwright install chromium
```

- [ ] **Step 2: Write `web/playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Write `web/tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/', expect: 'Two cook days' },
  { path: '/about', expect: 'About' },
  { path: '/thanks', expect: 'Check your email' },
  { path: '/privacy', expect: 'Privacy policy' },
  { path: '/terms', expect: 'Terms of use' },
];

for (const r of ROUTES) {
  test(`${r.path} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(r.path);
    await expect(page.locator('h1')).toContainText(r.expect);
    expect(errors).toEqual([]);
  });
}

test('404 page renders for unknown routes', async ({ page }) => {
  const res = await page.goto('/this-does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText("isn't on the menu");
});

test('homepage has OG and canonical meta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    /Stock Up Dinners/,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /og-default\.png$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /stockupdinners\.com/,
  );
});

test('sitemap is reachable', async ({ request }) => {
  const res = await request.get('/sitemap-index.xml');
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain('<sitemapindex');
});

test('robots.txt is reachable', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain('Sitemap:');
});
```

- [ ] **Step 4: Write `web/tests/e2e/signup.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('invalid email shows inline error and does not navigate', async ({ page }) => {
  await page.goto('/');
  const form = page.locator('#signup');
  await form.locator('input[type=email]').fill('not-an-email');
  await form.locator('button[type=submit]').click();
  await expect(form.locator('[data-helper]')).toHaveClass(/helper--error/);
  expect(page.url()).toMatch(/\/$/);
});

test('valid email POSTs to subscribe URL with UTM params and navigates to /thanks', async ({ page }) => {
  await page.route('**/form_submissions/**', async (route) => {
    const req = route.request();
    expect(req.method()).toBe('POST');
    const body = req.postData() ?? '';
    expect(body).toContain('email=test%40example.com');
    expect(body).toContain('utm_source=pinterest');
    await route.fulfill({ status: 200, body: 'ok' });
  });

  await page.goto('/?utm_source=pinterest&utm_medium=pin');
  const form = page.locator('#signup');
  await form.locator('input[type=email]').fill('test@example.com');
  await form.locator('button[type=submit]').click();

  await page.waitForURL('**/thanks', { timeout: 5000 });
  await expect(page.locator('h1')).toContainText('Check your email');
});

test('subscribe error keeps user on page with error helper', async ({ page }) => {
  await page.route('**/form_submissions/**', async (route) => {
    await route.fulfill({ status: 500, body: 'server error' });
  });

  await page.goto('/');
  const form = page.locator('#signup');
  await form.locator('input[type=email]').fill('test@example.com');
  await form.locator('button[type=submit]').click();

  await expect(form.locator('[data-helper]')).toHaveClass(/helper--error/, { timeout: 5000 });
  expect(page.url()).toMatch(/\/$/);
});
```

- [ ] **Step 5: Add a build-time fake subscribe URL so e2e signup tests have a target**

The signup spec routes any request matching `**/form_submissions/**` — so the actual env var just needs a value with that path. Create `web/.env.local`:

```bash
cd /Users/robertwarren/stock-up-dinners/web
cat > .env.local <<'EOF'
PUBLIC_BEEHIIV_SUBSCRIBE_URL=https://app.beehiiv.com/form_submissions/e2e-test
PUBLIC_GA4_MEASUREMENT_ID=
EOF
```

(`.env.local` is git-ignored.)

- [ ] **Step 6: Run unit + e2e tests**

```bash
cd /Users/robertwarren/stock-up-dinners/web
npm run test
npm run build
npm run test:e2e
```

Expected: all unit tests pass, build succeeds, all Playwright tests pass on both `chromium` and `mobile` projects.

- [ ] **Step 7: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add web/playwright.config.ts web/tests/e2e/ web/package.json web/package-lock.json
git commit -m "test(web): add Playwright e2e suite for routes, OG meta, signup flow"
```

---

## Task 14: GitHub Actions deploy workflow + web/README.md

**Files:**
- Create: `.github/workflows/deploy-web.yml`, `web/README.md`

- [ ] **Step 1: Write `.github/workflows/deploy-web.yml`**

```yaml
name: Deploy web

on:
  push:
    branches: [main]
    paths:
      - 'web/**'
      - '.github/workflows/deploy-web.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: web/package-lock.json

      - run: npm ci

      - run: npm run typecheck

      - run: npm run test

      - name: Build
        env:
          PUBLIC_BEEHIIV_SUBSCRIBE_URL: ${{ secrets.PUBLIC_BEEHIIV_SUBSCRIBE_URL }}
          PUBLIC_GA4_MEASUREMENT_ID: ${{ secrets.PUBLIC_GA4_MEASUREMENT_ID }}
        run: npm run build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: web/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Write `web/README.md`**

```markdown
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
```

- [ ] **Step 3: Configure GitHub Pages in the repo**

This is a manual UI step the user must do once before the workflow can deploy:

1. Go to GitHub → repo → Settings → Pages.
2. Under **Source**, choose **GitHub Actions**.
3. Under **Settings → Secrets and variables → Actions**, add the two repo secrets:
   - `PUBLIC_BEEHIIV_SUBSCRIBE_URL`
   - `PUBLIC_GA4_MEASUREMENT_ID`

(Document this in the commit message but the manual step happens in the GitHub UI.)

- [ ] **Step 4: Commit**

```bash
cd /Users/robertwarren/stock-up-dinners
git add .github/workflows/deploy-web.yml web/README.md
git commit -m "ci(web): add path-filtered GitHub Pages deploy workflow"
```

- [ ] **Step 5: Push and verify the workflow runs**

```bash
git push origin main
```

Watch the Actions tab. Expected: `Deploy web` workflow runs, builds, deploys. The first deploy publishes to the GitHub Pages default URL (e.g. `https://<user>.github.io/<repo>/` or `https://<user>.github.io/` depending on repo type). Open that URL — site should render. **Domain not wired yet** — that's Task 15.

---

## Task 15: Domain wiring (final task)

**Files:**
- Create: `web/public/CNAME`

This is the only step that can break a working live site, so it goes last and only after Task 14's deploy is verified working on the GitHub Pages default URL.

- [ ] **Step 1: Verify the live site at the GitHub Pages default URL**

Manually open the GitHub Actions deploy log → click the deployed environment URL. Confirm:
- Homepage loads
- Submitting the hero form with a real email (yours) creates a Beehiiv subscriber and triggers the welcome email within 60 seconds
- All navigation links work
- `/sitemap-index.xml` returns valid XML
- Lighthouse scores from Chrome DevTools: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95

If anything fails, fix it before proceeding.

- [ ] **Step 2: Add the CNAME file**

```bash
cd /Users/robertwarren/stock-up-dinners
echo 'stockupdinners.com' > web/public/CNAME
git add web/public/CNAME
git commit -m "chore(web): add CNAME for stockupdinners.com"
git push origin main
```

Wait for the deploy workflow to finish.

- [ ] **Step 3: Configure DNS at the domain registrar**

At the registrar managing `stockupdinners.com` DNS, add the four GitHub Pages A records and a `www` CNAME. Per [GitHub's docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain):

```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   <user>.github.io.
```

(Replace `<user>` with the actual GitHub username/org for the repo.)

- [ ] **Step 4: Configure custom domain in GitHub Pages settings**

Repo → Settings → Pages → Custom domain → enter `stockupdinners.com` → Save. Wait for DNS check to pass (can take a few minutes to an hour). Then check **Enforce HTTPS** once it becomes available (Let's Encrypt cert provision usually takes 15–60 minutes after DNS resolves).

- [ ] **Step 5: Verify the live custom domain**

Wait until DNS propagates (use `dig stockupdinners.com` to verify A records, or [whatsmydns.net](https://www.whatsmydns.net/)). Then:

```bash
curl -I https://stockupdinners.com
curl -I https://www.stockupdinners.com
```

Expected: both return `HTTP/2 200`. Visit in a browser — site loads over HTTPS, no cert warnings.

- [ ] **Step 6: Validate social share previews**

- [Facebook share debugger](https://developers.facebook.com/tools/debug/) — paste `https://stockupdinners.com` → expect title, description, OG image displayed.
- [Twitter card validator](https://cards-dev.twitter.com/validator) (or paste link in a Twitter draft post for live preview) — expect `summary_large_image` card.
- Lighthouse audit on the production URL — confirm same scores as Step 1.

- [ ] **Step 7: Run end-to-end signup smoke test on production**

1. Open `https://stockupdinners.com/?utm_source=manual&utm_medium=test&utm_campaign=launch-verify` in an incognito window.
2. Submit a real email.
3. Verify the redirect to `/thanks`.
4. Verify the welcome email arrives within 60 seconds.
5. Verify the PDF link in the welcome email returns a valid PDF.
6. In Beehiiv → Subscribers, find the new record and verify `utm_source=manual`, `utm_medium=test`, `utm_campaign=launch-verify` are stored as custom fields.
7. In GA4 → Realtime, verify `signup_attempt` and `signup_complete` events fired.

If all 7 pass, the site is live and the funnel works end-to-end.

---

## Self-review

**Spec coverage:**
- Section 1 (funnel & architecture) → Tasks 1, 8, 14, 15 cover Astro, GitHub Pages, browser-side Beehiiv POST, no-backend
- Section 2 (info architecture, 6 routes) → Tasks 10, 11
- Section 3 (visual system, tokens, type) → Task 2
- Section 4 (component inventory) → Tasks 4, 8, 9
- Section 5 (homepage structure) → Task 10
- Section 6 (email capture flow + states) → Tasks 7, 8 (with full state machine in signup.ts)
- Section 7 (analytics + UTM) → Tasks 5, 6, 7 (UTM forwarded in signup, GA4 events tracked)
- Section 8 (build & deploy, monorepo at `web/`, env vars, SEO essentials) → Tasks 1, 12, 14
- Section 9 (out of scope) → respected; nothing in plan touches `/recipes`, `/app`, testimonials
- Section 10 (acceptance criteria) → Task 13 covers route/console/OG/sitemap; Task 15 covers Lighthouse, signup E2E on prod, OG validators, DNS, HTTPS

**Type consistency:** `attachSignupForm`, `extractUtmParams`, `track`, `AnalyticsEvent`, `SignupDeps` are referenced consistently across tasks.

**No placeholders:** every step has actual content. Two manual steps in Task 14 (GitHub UI for Pages source + secrets) and Task 15 (registrar DNS) are unavoidable external configuration — they're documented with exact values, not deferred.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-28-marketing-site-and-acquisition.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using the executing-plans skill, batch execution with checkpoints.

Which approach?
