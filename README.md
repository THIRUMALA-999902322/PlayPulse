# PlayPulse

Find a game. Join in. Play now.

A mobile-first web app for amateur and campus sport: discover games on a live map,
join them, and run everything about the match — chat, score, stream, kit funding and
match-day check-in — from inside the match itself.

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
| `src/hooks/useMatchDetail.js` | Per-match chat, commentary, fundraisers, weather |
| `src/screens/` | One file per screen |
| `src/lib/format.js` | Time, distance and status formatting |
| `src/styles/theme.js` | Design tokens and the whole stylesheet |
| `supabase/schema.sql` | Complete backend: tables, RLS, functions |

Two rules keep the UI honest:

**Every control does something.** Writes funnel through `requireAuth`, so a guest
tapping *Join* gets a sign-in screen explaining why, never a dead click. Actions apply
optimistically and roll back with a readable message if the server disagrees.

**Multi-table work happens in Postgres.** Joining, leaving, checking in and donating
each touch two tables, so they run as `security definer` functions (`join_match`,
`leave_match`, `set_checkin_step`, `approve_player`, `donate_to_fundraiser`). A dropped
round-trip can't leave a roster row without its counter.

## Auth

Signing in is optional — the whole board is browsable as a guest, and the app only
asks for an account when you try to write something.

New Supabase projects require email confirmation by default. To let players in the
moment they sign up, turn off **Confirm email** under Authentication → Sign In / Up →
Email in the Supabase dashboard. Leave it on and the app handles it: signup explains
that a confirmation link is on its way and offers to resend it.
