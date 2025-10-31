# Warranty Tracker — Ruthless MVP Roadmap

## What matters
- Find a warranty and take action in under 10 seconds. Every screen and feature exists to make that happen.

## MVP scope (ship in 1 week)
- Emergency “Something Broke” flow: global button → search → warranty status → actions.
- Actions: call support, open support email (pre‑filled), open claim portal link, download receipt PDF.
- Warranty CRUD: name, category, purchase date, warranty length, store, support contacts, receipt image(s).
- Fast search: instant filter by name/category; keyboard focus; mobile-friendly.
- Basic expiry signal: days left/expired badge (no scheduling infra yet).
- Supabase wiring: tables, auth persistence, env variables loaded from `.env.local`.

## Non‑goals (defer)
- Achievements, streaks, protection score, fancy dashboards, predictive insights.
- Family sharing/households, room views, photo timelines, AR/AI assistants.
- Push/SMS/email scheduling, calendar sync.

## Acceptance criteria
- Time to find-and-act (cold start) ≤ 10s on average hardware.
- Add warranty success rate ≥ 95% (no blocking validation or crashes).
- Emergency flow shows correct status and at least 3 working actions per warranty.
- App runs with only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set.

## Implementation slices
1) Data and env
   - Create Supabase tables: warranties, receipts, brands/support.
   - Load env from `.env.local`; app boot fails gracefully if missing.
2) Warranty basics
   - Create/Edit/Delete warranty with minimal required fields.
   - Receipt upload and PDF export.
3) Emergency flow
   - Global button; search with debounce; status (active/expired days left).
   - Actions: call, email (templated), portal link, download receipt.
4) UX polish for speed
   - Keyboard focus, zero-friction forms, optimistic UI, skeletons.

## Metrics to watch
- TTFW (time to find warranty): median and p95.
- Crash rate and failed API calls.
- Emergency action conversions (call/email/portal/download).

## Backlog (after MVP ships)
- Notifications (email/push), value dashboard, claim tracking, family sharing.
- Gamification, predictive insights, visual galleries.

— Keep it brutal: If it doesn’t reduce TTFW or enable action, it waits.

