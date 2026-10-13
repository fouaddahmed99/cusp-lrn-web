# CLAUDE.md — cusp-lrn-web

The public static website for CUSP LRN. The full project rules (Part A prime directive, Part B5 prohibited inputs, lead-source rules) are restated verbatim in the private repo's `CLAUDE.md` and apply here too. The short version:

- **Never write clinical content** (facts, numbers, questions, answers, explanations, notes, flashcards, vignettes) anywhere in this repo. Real content arrives only through the private repo's publish workflow into `content/`. Test and demo data lives in `content.sample/` and must be obviously fake (`SAMPLE`).
- **Never hand-edit `content/` or `src/contract/`**. Both are overwritten by the publish workflow.
- **Never show an answer key before the user submits.** Fetch `content/a/<id>.json` only after submission (`ContentStore.getAnswer`).
- **UI talks only to `src/adapters/`.** Hosted features (accounts, payments, email, analytics) stay disabled stubs with no UI.
- **Every displayed fact shows its citation** (`components/citations.tsx`).
- **No external services** besides GitHub. No tracking. Progress stays in IndexedDB on the user's device.
- **Brand values come only from `cusp.config.ts`.**
- **All URLs go through `asset()` or Next `<Link>`**, so the GitHub Pages base path works.

Commands: `pnpm dev` · `pnpm run check` · `pnpm build:sample` · `pnpm test:e2e`.
