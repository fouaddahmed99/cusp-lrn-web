# cusp-lrn-web (public)

The **CUSP LRN** website: free, source-grounded board prep for pediatric dentistry residents. It's a static site on GitHub Pages: no accounts, no tracking, and progress stays on the user's device.

**Setup:** follow the step-by-step guide in the private `cusp-lrn-content` repo's README (section "Setup guide"). For this repo you only need to: make it **public**, set **Settings → Pages → Source: GitHub Actions**, and run **Actions → Deploy to GitHub Pages** once.

## What's here

| Path | Purpose |
|---|---|
| `cusp.config.ts` | **The one brand config:** name, product line, logo, colors (TEMPORARY), legal placeholders, contact email, feature flags |
| `content/` | Published content. **Written only by the private repo's publish workflow.** Empty until the first publish |
| `content.sample/` | Obviously fake SAMPLE content for development and tests |
| `src/contract/` | The public content contract, copied from the private repo by the publish workflow |
| `src/adapters/` | `ContentStore`, `ProgressStore` (IndexedDB), entitlements (`FREE_LAUNCH`), and disabled hosted-edition stubs |
| `src/app/` | Pages: marketing, legal, and the study app under `/app/` |
| `legal/` | Terms, Privacy, Refunds, Disclaimer **templates** (placeholders from `cusp.config.ts`; have a lawyer review) |
| `docs/hosted-edition.md` | What to build to move off GitHub Pages later |

## Develop

```bash
pnpm install
pnpm dev                 # http://localhost:3000 with SAMPLE content
pnpm run check           # lint + typecheck + unit tests + content contract validation
pnpm build:sample && pnpm test:e2e   # static build + Playwright end-to-end/accessibility tests
```

## Features (all free)

Question bank (tutor/timed, filters, flags, notes, citations, error reports) · QE simulator (fixed blueprint-weighted forms, timer, navigator, shortfall instead of padding) · on-device analytics · FSRS flashcards · high-yield library with print and audio · OCE practice with partner examiner link · study planner · progress export/import · offline PWA · dark mode.

## Limits of the free edition

- **Answer keys:** a static site can't hide answer keys from a determined user. Keys are fetched per item only after the user submits, and are never shown before then. The hosted edition removes this limitation.
- **Percentiles, accounts, residency-program dashboards, referrals, email and payments** need a server. They exist only as disabled adapter stubs with no UI. See `docs/hosted-edition.md`.
- **GitHub Pages is for non-commercial sites.** Payments must not be enabled here; move to the hosted edition first.

Not affiliated with or endorsed by the ABPD, AAPD, ADA, AHA or IADT. All items are original. Educational content, not clinical advice.
