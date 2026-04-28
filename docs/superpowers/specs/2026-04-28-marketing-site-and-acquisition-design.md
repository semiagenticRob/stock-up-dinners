# Stock Up Dinners — Marketing Site & Acquisition Funnel (v1)

**Date:** 2026-04-28
**Status:** Approved design
**Goal:** Drive traffic from Pinterest / Reddit / Facebook Costco groups to a single conversion-focused site that captures email in exchange for the free 14-dinner PDF, lands subscribers in Beehiiv, and grows into the app's marketing front when the app ships.

---

## 1. Funnel & architecture

```
Visitor (Pinterest / Reddit / Facebook Costco groups)
   │
   ▼
stockupdinners.com   ← Astro static site, deployed to GitHub Pages, custom domain via CNAME
   │
   ▼ inline form on hero + closing CTA
Beehiiv subscribe API   ← browser-side fetch(), no backend
   │
   ▼
Beehiiv welcome sequence (3 emails)
   │  E1 (instant): PDF link + quick-start
   │  E2 (day 3):   "How's Week 1 going?" engagement check
   │  E3 (day 7):   tease the $25 6-week system
   ▼
Subscriber on Beehiiv list
   │
   ▼ (when the app ships)
App waitlist segment in Beehiiv → launch announcement → install
```

**Key architectural properties:**
- Site is 100% static. No backend, no API routes, no serverless functions.
- Email capture is a direct `fetch()` from the browser to Beehiiv's public subscribe endpoint. Beehiiv's publication-id is safe to ship in client code.
- Beehiiv hosts the PDF file. The link in welcome email E1 points to Beehiiv's file-hosting URL. Failover plan: if the Beehiiv URL is awkward (long, ugly, or unstable), commit the PDF to `public/` in the Astro project and serve from `stockupdinners.com/the-plan.pdf`.
- The site never touches Supabase or any of the app's backend. Funnel and product are decoupled until the app ships.

---

## 2. Information architecture

### v1 routes (Scope 2)

| Route | Purpose |
|---|---|
| `/` | Landing — hero, value props, signup form, social proof, FAQ. >95% of traffic lands here. |
| `/thanks` | Post-signup confirmation. "Check your email — PDF is on its way." Re-shows form for "didn't get it?" recapture. |
| `/about` | One page, ~200–400 words, photo, the "why this exists" story. Trust signal for cold traffic. |
| `/privacy` | Standard privacy policy. Required when collecting email. |
| `/terms` | Standard terms of use. |
| `/404` | Custom 404 with CTA back to `/`. |

### Future-additive (post-app-launch, **not v1 scope**)

- `/app` — app feature pages, screenshots, App Store + Play Store badges.
- `/recipes` — content-marketing blog (Scope 3 territory). Defer until Pinterest signal warrants the content treadmill.
- `newsletter.stockupdinners.com` — Beehiiv-hosted public newsletter archive on a subdomain.

### App crossover plan

When the app launches, the site evolves additively — no rewrite. New `/app` page links from the header (replacing or sitting next to "Get the free plan"), the home page gets a new section above the FAQ (app feature highlights + store badges), and the welcome email sequence gets a new email after E3 inviting subscribers to install. Beehiiv segments separate "free PDF only" subscribers from "app installer" subscribers based on a UTM parameter on the install link.

---

## 3. Visual system

**Direction:** "Pragmatic / Tool-Feel" — system-forward, structure-first, "I respect your time" energy. Restraint is the whole tell.

### Color tokens

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0F172A` | Headlines, primary buttons |
| `body` | `#334155` | Body copy |
| `muted` | `#64748B` | Captions, labels |
| `bg` | `#FFFFFF` | Page background |
| `bg-tint` | `#F8FAFC` | Alternating section bands |
| `border` | `#E2E8F0` | Dividers, outlines |
| `accent` | `#DC2626` | Wordmark mark, eyebrow text, key link underlines |
| `accent-ink` | `#FFFFFF` | Text on `accent` |
| `success` | `#15803D` | Form success state only |

The accent is sparingly used — wordmark square, eyebrow labels above section headlines, the "→" underline on the `/about` link, and form success/error states. No gradients. No shadows beyond `0 1px 0 rgba(15,23,42,0.04)` on button hover.

### Typography

- **Display + body:** Inter (`@fontsource/inter`), weights 400 / 500 / 600 / 700 / 800. Loaded via Astro's Fontsource integration — no Google Fonts CDN dependency.
- **Mono:** JetBrains Mono (`@fontsource/jetbrains-mono`), weights 400 / 500. Used for indices ("01"), eyebrow labels, and meal-grid chips.
- One family across the site (Inter). Mono is for accents only.

### Type scale

| Level | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| `h1` (hero) | 56px / 38px mobile | 800 | 1.04 | -0.028em |
| `h2` (section) | 36px / 28px mobile | 800 | 1.10 | -0.020em |
| `h3` (sub) | 20px | 700 | 1.25 | -0.015em |
| Body | 16px | 400 | 1.55 | normal |
| Caption / muted | 13px | 500 | 1.45 | normal |
| Mono accent | 11px | 500 | — | 0.08em |

### Layout primitives

- Container: max-width 1120px, padding 24px mobile / 40px desktop.
- Section spacing: 96px desktop / 64px mobile.
- Radii: 6px buttons, 8px cards. Never larger.
- Borders: `1px solid border`. No drop shadows except the subtle button-hover lift.

---

## 4. Component inventory

| Component | File | Used on | Notes |
|---|---|---|---|
| `Wordmark.astro` | `src/components/Wordmark.astro` | `Header`, `Footer` | Red square mark + "STOCK UP DINNERS" all-caps. Two sizes. |
| `Header.astro` | `src/components/Header.astro` | All pages | Wordmark left, "Get the free plan" anchor right. Anchor links to `#signup` on `/`, deep-links to `/#signup` everywhere else. |
| `Footer.astro` | `src/components/Footer.astro` | All pages | Wordmark + links: About / Privacy / Terms / Contact email. |
| `Hero.astro` | `src/components/Hero.astro` | `/` | h1, subhead, `SignupForm`, hero meta line, `MealGridPreview`. |
| `SignupForm.astro` | `src/components/SignupForm.astro` | `/`, `/thanks` | Email input + button. Three states: idle, submitting, success, error. Reusable in any section. |
| `ValueProps.astro` | `src/components/ValueProps.astro` | `/` | 3-up grid: "14 dinners / 2 cook days / 1 list". |
| `MealGridPreview.astro` | `src/components/MealGridPreview.astro` | `/` (hero), `/` (PDF preview section) | Mono-font grid of meal names with index numbers. |
| `PDFCoverMock.astro` | `src/components/PDFCoverMock.astro` | `/` | Visual mock of the PDF cover. Replaces real food photography for v1. |
| `FAQ.astro` | `src/components/FAQ.astro` | `/` | 6 expandable Q/As. Native `<details>` for accessibility, no JS framework. |
| `Section.astro` | `src/components/Section.astro` | All | Wraps content, handles spacing + optional `tint` prop for alt-band background. |
| `PageShell.astro` | `src/layouts/PageShell.astro` | All | Header + slot + Footer + GA4 tag in `<head>`. Sets `<title>`, `<meta description>`, OpenGraph + Twitter card tags from props (image defaults to `/og-default.png`). |

Total: ~11 files. No carousel, no testimonial slider, no scroll-jack animations. Tool-feel is the absence of those things.

---

## 5. Homepage structure

The `/` page is composed top-to-bottom:

1. **Header** — wordmark left, "Get the free plan" anchor right.
2. **Hero** — eyebrow meta line ("14 DINNERS · 2 COOK_DAYS · 1 COSTCO_LIST"), h1 ("Two cook days. Two weeks of dinner."), subhead, `SignupForm` (id=`signup` for anchor target), `MealGridPreview` (8 meal cells).
3. **Value Props** — `bg-tint` band. Eyebrow "How it works", h2 "Designed to fit your week, not consume it.", lede, 3-up `ValueProps`.
4. **Inside the PDF** — white. Eyebrow "Inside the free PDF", h2 "A full system, not a recipe roundup.", two-column: `PDFCoverMock` left, structured contents list right.
5. **Why this exists** — `bg-tint`. Two-column trust block: small label "WHY THIS EXISTS" + h2 left, two short paragraphs + `/about` link right.
6. **FAQ** — white. Eyebrow "Common questions", h2 "FAQ", 6 collapsible rows (native `<details>`).
7. **Closing CTA** — `bg-tint`. Centered h2 "Get the free 14-dinner plan.", lede, `SignupForm` (second instance).
8. **Footer**.

---

## 6. Email capture flow

### Mechanism
- `SignupForm` posts directly to Beehiiv's public subscribe endpoint via `fetch()`.
- Beehiiv publication ID is read from `import.meta.env.PUBLIC_BEEHIIV_PUBLICATION_ID` so the build pipeline can inject it. Public-by-design — no secret to leak.
- UTM parameters present on the URL at form-submit time are forwarded to Beehiiv as custom fields (`utm_source`, `utm_medium`, `utm_campaign`) so we can segment subscribers by acquisition channel.

### States

| State | Trigger | UI |
|---|---|---|
| `idle` | Initial render | Email input + "Send the plan" button + helper text. |
| `submitting` | Form submit | Button → "Sending…", disabled. |
| `success` | 200 from Beehiiv | Form replaced with success message ("Check your email — PDF is on its way."). Then `window.location.href = '/thanks'` after 800ms so users see the success state before redirect. GA4 `signup_complete` event fires here. |
| `error` | Network error or non-2xx | Form stays mounted, red helper text replaces gray helper, button re-enabled. Error message: "Something went wrong. Try again or email us at hi@stockupdinners.com." |

### `/thanks` page
Confirms PDF is en route, sets expectation that the welcome email may take 30–60 seconds, surfaces a "didn't get it?" hint pointing to spam folder + a recapture form (in case the user typo'd their email).

### Welcome sequence (configured in Beehiiv, not in code)
- **E1 (instant):** PDF download link + quick-start tips.
- **E2 (day 3):** Engagement check — "how's week 1 going?"
- **E3 (day 7):** Tease the $25 Gumroad 6-week system.
- **E4 (added when app launches):** App install CTA with deep links to App Store / Play Store, UTM-tagged so app-installers segment in Beehiiv.

---

## 7. Analytics & attribution

- **Tool:** Google Analytics 4. Tag installed in `PageShell.astro`'s `<head>` and gated behind a measurement ID env var so non-prod builds don't pollute the property.
- **Events tracked:**
  - `page_view` (auto)
  - `signup_attempt` — fires on form submit, before Beehiiv response.
  - `signup_complete` — fires on Beehiiv 200.
  - `signup_error` — fires on Beehiiv error response.
  - `pdf_link_click` — fires if a user clicks any PDF download link surfaced on the site (e.g. on `/thanks` if we add one).
  - `cta_click_app_store` and `cta_click_play_store` — added when app launches.
- **UTM convention** (used in Pinterest pin URLs, Reddit comment links, Facebook posts):
  - `utm_source` ∈ { `pinterest`, `reddit`, `facebook`, `twitter`, `direct` }
  - `utm_medium` ∈ { `pin`, `comment`, `post`, `bio` }
  - `utm_campaign` — free-form per drop, e.g. `launch-week-1`, `r-costco-2026-04`.
  - Forwarded to Beehiiv on signup so subscriber segmentation matches GA segmentation.

---

## 8. Build & deploy

### Repo & framework
- The Astro project lives **inside the existing `stock-up-dinners` repo** under a top-level `web/` directory, fully isolated from the React Native app.
- `web/` has its own `package.json`, `node_modules`, and lockfile — it does **not** share dependencies with the RN app at the repo root. The two trees are independent npm projects that happen to share a git remote.
- Folder layout (only `web/` is new — everything else is the existing RN app):

  ```
  stock-up-dinners/
    app/                       # RN — Expo Router routes (unchanged)
    components/                # RN
    db/                        # RN — WatermelonDB
    hooks/                     # RN
    lib/                       # RN — Supabase client
    providers/                 # RN
    supabase/                  # RN — server schema + migrations
    docs/                      # specs, design docs (shared)
    web/                       # ← Astro marketing site (new)
      astro.config.mjs
      package.json
      tsconfig.json
      public/
        og-default.png
        favicon.svg
        the-plan.pdf           # if Beehiiv-hosting fails over
        CNAME                  # stockupdinners.com
        robots.txt
      src/
        components/
        layouts/
        pages/
        styles/
    .github/
      workflows/
        deploy-web.yml         # builds + deploys web/ on push to main
                               # path-filtered to web/** only
  ```

- `web/`'s `astro.config.mjs` sets `output: 'static'`, TypeScript `strict: true`.
- Tailwind not required — design system is small enough to live in `web/src/styles/global.css` with CSS custom properties for the tokens.
- The existing RN-app `CLAUDE.md` gets a short "Marketing site lives in `web/` — separate npm project, see `web/README.md`" note so future Claude sessions don't mix the two.

### Deployment
- GitHub Actions workflow at `.github/workflows/deploy-web.yml` using the official `actions/deploy-pages@v4` Astro template.
- **Path-filtered:** the workflow only triggers on changes to `web/**` and `.github/workflows/deploy-web.yml`. Pushes touching only RN-app files do not run the web build, and vice versa.
- The workflow `cd web` before `npm ci` and `npm run build`; deploy artifact is `web/dist`.
- Custom domain via `web/public/CNAME` containing `stockupdinners.com`. DNS: A records pointing to GitHub Pages IPs + a `www` CNAME.
- HTTPS enforced via GitHub Pages' built-in Let's Encrypt.
- **Domain wiring is the final step** of the launch. Build, deploy, verify on the GitHub Pages default URL (`<user>.github.io/<repo>`) first; only point DNS once the live site looks correct.

### Env vars (build-time, baked into client bundle)
- `PUBLIC_BEEHIIV_PUBLICATION_ID`
- `PUBLIC_GA4_MEASUREMENT_ID`

Both are public by design (visible in client bundle). No secrets.

### SEO essentials
- `@astrojs/sitemap` integration generates `/sitemap.xml` at build time.
- `public/robots.txt` allows all crawlers, references the sitemap.
- `public/og-default.png` — single 1200×630 OpenGraph image used for any page that doesn't override (matches the visual system: black background, white wordmark, "14 dinners. 2 cook days. 1 Costco list." headline). Built once in Figma/Canva, committed to repo.
- `public/favicon.svg` + fallback `favicon.ico` derived from the wordmark mark (red square).

---

## 9. Out of scope for v1

Explicitly deferred:
- Recipe / content blog (`/recipes`)
- Newsletter archive subdomain
- App-related pages (`/app`, screenshots, store badges)
- Testimonials section (no testimonials yet — add when reply-mail provides usable quotes)
- Food photography (PDF cover mock substitutes for v1)
- Newsletter sign-up *separate* from the lead-magnet form (single funnel for now)
- A/B testing infrastructure
- Cookie consent banner (defer until traffic warrants — GA4 alone, no marketing cookies, no consent required in US; revisit if EU traffic becomes meaningful)

---

## 10. Acceptance criteria for v1 launch

- [ ] All 6 routes render with no console errors in Chrome, Safari, Firefox.
- [ ] Mobile layout works at 375px (iPhone SE) without horizontal scroll.
- [ ] Lighthouse: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- [ ] Submitting the hero form with a valid email creates a Beehiiv subscriber and triggers the welcome email within 60 seconds.
- [ ] Submitting with an invalid email shows an inline error and does not redirect.
- [ ] GA4 receives `signup_complete` events and they appear in the realtime view.
- [ ] UTM params from the URL are attached to the Beehiiv subscriber record.
- [ ] `stockupdinners.com` resolves to the deployed site over HTTPS, both apex and `www`.
- [ ] PDF download link in welcome email E1 returns a valid PDF on first try.
- [ ] Pasting `stockupdinners.com` into the [Facebook share debugger](https://developers.facebook.com/tools/debug/) and a Twitter/X card validator returns a 1200×630 OG image, title, and description (no fallback / missing image warnings).
- [ ] `/sitemap.xml` returns valid XML listing all 6 routes; `/robots.txt` resolves and references the sitemap.
