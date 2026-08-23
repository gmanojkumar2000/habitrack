# HabitRack Agent Instructions

HabitRack is a kid-friendly habit and manners tracker with parent controls,
daily and weekly tasks, points, streaks, rewards, and penalties. The React/Vite
PWA talks to a Node server backed by a local SQLite database through sql.js.

## Paths And Release Model

- Canonical source: `C:\maglab_codebase\habitrack`
- Homelab deployment: `C:\containers\habitrack`
- Persistent runtime data is not source code. Never copy or overwrite the live
  SQLite database during a code promotion.

## Read First

- `project_inital_setup.md` for the intentionally small core loop and V1 limits.
- `USER_GUIDE.md` for current user-visible behavior.
- `server/database.mjs`, `server/index.mjs`, and tests before changing
  persistence or API behavior.

## Product And Data Contracts

- The server-side SQLite database is authoritative. Do not reintroduce a second
  browser persistence/sync model without an explicit migration design.
- Preserve users, habit templates, daily history, ad hoc entries, rewards,
  penalties, notes, parent settings, and existing IDs across schema changes.
- Keep daily and weekly frequency semantics distinct. Test week boundaries,
  consecutive misses, vacation mode, penalty reversal, streak milestones, and
  idempotent requests.
- Keep the parent/child boundary clear. Protect parent-only actions and never
  expose the parent PIN in logs or client fixtures.
- Use positive, non-shaming language. Keep competition and penalties explainable
  and reversible by the parent.
- Keep generated `dist/` and `www/` output out of source edits unless the
  deployment contract explicitly requires checked-in bundles.

## Next-Step Bias

Protect the validated HabitRack core loop before adding Carbit-style racing or
deeper gamification. Prefer regression coverage and persistence safety around
the features documented in `USER_GUIDE.md`.

## Validation

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:e2e` for core user flows

Use isolated test data. Invoke `$promote-maglab-deployment` only for an
authorized update to `C:\containers\habitrack`.
