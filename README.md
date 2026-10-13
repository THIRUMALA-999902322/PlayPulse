# PlayPulse

Find a game. Join in. Play now.

A mobile-first web app for amateur and campus sport: discover games on a live map,
join them, and run everything about the match — chat, score, stream, kit funding and
match-day check-in — from inside the match itself.

**[Watch the 84-second explainer](promo/playpulse-explainer.mp4)**, a narrated 3D walkthrough
of every step. How it was made and how to re-render it is in [`promo/`](promo/README.md).

## Running it

```bash
npm install
npm run dev
```

Create a `.env` from `.env.example` with your Supabase project URL and publishable key.
Without them the app still runs, falling back to a demo board held in memory.

```bash
npm run build   # production bundle
npm run lint    # eslint
```

## How it's put together

Five slots in the bottom bar — Map, Matches, a **+** button, Portfolio, Me — and
everything else is reached in context rather than as another tab.

| Path | What lives there |
| --- | --- |
| `src/App.jsx` | Shell: tab switching, overlays, deep links |
| `src/context/AppDataContext.jsx` | All shared state and every mutating action |
| `src/context/AuthContext.jsx` | Supabase session handling |
| `src/hooks/useMatchDetail.js` | Per-match chat, commentary, scoreboard, weather |
| `src/screens/` | One file per screen |
| `src/lib/format.js` | Time, distance and status formatting |
| `src/lib/calendar.js` | Builds the .ics a player downloads for a match |
| `src/lib/a11y.js` | Makes tappable cards keyboard-reachable |
| `src/styles/theme.js` | Design tokens and the whole stylesheet |
| `supabase/schema.sql` | Complete backend: tables, RLS, functions |

Two rules keep the UI honest:

**Every control does something.** Writes funnel through `requireAuth`, so a guest
tapping *Join* gets a sign-in screen explaining why, never a dead click. Actions apply
optimistically and roll back with a readable message if the server disagrees.

**Multi-table work happens in Postgres.** Joining, leaving and checking in
each touch two tables, so they run as `security definer` functions (`join_match`,
`leave_match`, `set_checkin_step`, `approve_player`). A dropped
round-trip can't leave a roster row without its counter.

One consequence worth knowing before adding a query: every `user_id` and `created_by`
column points at `public.profiles`, not `auth.users`. PostgREST can only resolve a
`profiles(...)` embed when the foreign key targets that table, and a missing
relationship fails *silently* — the rows come back empty rather than erroring. That is
why `loadAll` treats any failed query as fatal instead of shrugging one off.

## Auth

Signing in is optional — the whole board is browsable as a guest, and the app only
asks for an account when you try to write something.

New Supabase projects require email confirmation by default. To let players in the
moment they sign up, turn off **Confirm email** under Authentication → Sign In / Up →
Email in the Supabase dashboard. Leave it on and the app handles it: signup explains
that a confirmation link is on its way and offers to resend it.

## What is real, and what is not

Everything shown to a player is computed from their own activity. There is no
seeded content and no sample data anywhere in the app.

- **Reliability** — of the matches you joined that have since finished, the share
  you actually checked in to. Recalculated by trigger; a no-show moves it.
- **Portfolio** — counted in the database from matches joined, split competitive
  vs practice. Milestones are derived from those numbers, so none can be claimed
  without the record to support it.
- **Match privacy** — `Invite Only` is enforced by row level security, together
  with chat, so a private match and its conversation are invisible to anyone not
  on the roster.
- **Recurrence** — an hourly job seeds the next occurrence of a repeating match,
  catching up if several intervals passed while nobody was using the app.

Deliberately absent: payments. A donations feature existed and moved no money,
so it was removed rather than left as decoration. Adding it back means a Stripe
account, an entity that can receive money, and terms — not just code.

## Known limits before a wide launch

- **Free-tier database.** Supabase pauses a project after about a week of no
  activity and destroys it after 90 days paused. The hourly job above keeps it
  awake, but real user data belongs on a paid plan with backups.
- **No moderation tools.** Chat is open to anyone signed in, with no reporting,
  blocking, or profanity handling.
- **Leagues are read-only.** Standings and fixtures render, but nothing in the
  app creates a league or records a result yet.
- **No automated tests.** Behaviour has been verified by hand against the
  running app.
