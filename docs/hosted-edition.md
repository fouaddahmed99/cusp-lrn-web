# Moving to the hosted edition

The GitHub-only edition is designed so a hosted edition plugs in new adapters **without touching UI code**. Every page talks to interfaces in `src/adapters/`, never to storage directly.

## Adapters to implement

| Interface | GitHub edition | Hosted edition |
|---|---|---|
| `ContentStore` (`adapters/content.ts`) | Static JSON from `public/content/` | API backed by PostgreSQL. **Answer keys returned only after the server records a submission** (removes the static-site key exposure) |
| `ProgressStore` (`adapters/progress.ts`) | IndexedDB on the device | Same methods, synced to the server per user; IndexedDB kept as the offline cache |
| `AuthProvider` (`adapters/hosted.ts`) | Disabled, returns `null` | Auth.js or Supabase Auth; sign-up records `signedUpAt` and `foundingMember` for users who joined during the free period |
| `EntitlementsService` (`adapters/entitlements.ts`) | `FREE_LAUNCH` grants everything | Same `canAccess()` checked **server-side**; activate plans in `PLANS` |
| `PaymentsProvider` | Disabled; nothing rendered while `PAYMENTS_ENABLED=false` | Stripe Checkout, Customer Portal, webhooks, coupons, refunds |
| `EmailProvider` | Disabled | Resend (opt-in updates; at least 30 days' notice before any feature becomes paid) |
| `AnalyticsProvider` | No-op (no tracking) | Optional privacy-friendly, cookie-free analytics; investor metrics dashboard |
| Feedback | Prefilled GitHub Issues + email | Unchanged, or an in-app queue |

Server-only features become possible: percentiles (once N ≥ 50 per form), residency program groups with aggregate dashboards (individual data only with consent), referrals, the AI OCE examiner (limited to the vignette's approved model answer and cited facts), and the acquirer/investor dashboard.

## Content pipeline

The private `cusp-lrn-content` repo stays the source of truth. Its `publish.yml` bundle can be loaded into the database by a small import job instead of (or in addition to) being pushed to the web repo. The public contract in `src/contract/` is the import format.

## Migrating users' progress

Users export a progress file from **Settings → Export progress**:

```json
{ "format": "cusp-lrn-progress", "version": 1, "exportedAt": "…",
  "stores": { "attempts": [], "sessions": [], "marks": [], "cards": [], "reviews": [], "oce": [], "kv": [] } }
```

After signing in to the hosted edition, the user uploads the file. The server validates it with the same schema (`adapters/progress.ts → Backup`), attaches every record to the user, and merges it:

- `attempts` and `reviews` are appended (de-duplicate on `itemId + at`)
- `cards` are keyed by `id` (keep the later `due`)
- `marks` are keyed by `itemId`
- `kv` holds `profile`, `settings` and `plan-state`

Users who joined during the free period are flagged `foundingMember`.

## Before enabling payments

1. Move hosting off GitHub Pages (its terms are for non-commercial sites).
2. Implement the adapters above, with entitlement checks enforced on the server.
3. Give users at least **30 days' in-app and email notice** before any feature becomes paid. Never remove access silently.
4. Publish the pricing page and the final Refund Policy.
