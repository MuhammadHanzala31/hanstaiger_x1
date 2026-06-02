# Phase 4 — Admin Panel Implementation Plan

**Goal:** A private, Hanstaiger-styled admin at `/admin` (Supabase Auth) where the team views reservations, manages availability, and edits yachts/services/pricing — all dynamic, no redeploys.

**Architecture:** Supabase Auth (email+password); middleware refreshes the session and guards `/admin/*` (redirect to `/admin/login` when signed out). Server Components read data via the cookie-aware server client; mutations are Server Actions using the service-role client + `revalidatePath`. No public signup — admin accounts are created in the Supabase dashboard. "Authenticated == admin" since only manually-created accounts can sign in (documented; can later be tightened to an allowlist).

**Tech Stack:** Next.js App Router, `@supabase/ssr` middleware, Tailwind tokens from Phase 2.

---

## File Structure
```
middleware.ts                          # session refresh + /admin guard
lib/supabase/middleware.ts             # updateSession helper
app/admin/login/page.tsx               # email+password sign-in
app/admin/login/actions.ts             # signIn server action
app/admin/layout.tsx                   # auth gate + sidebar shell
app/admin/actions.ts                   # signOut
app/admin/page.tsx                     # dashboard (counts, upcoming, deposit totals)
app/admin/reservations/page.tsx        # list
app/admin/reservations/[id]/page.tsx   # detail + cancel
app/admin/reservations/actions.ts      # cancelBooking (frees block)
app/admin/availability/page.tsx        # per-yacht calendar block/unblock
app/admin/availability/actions.ts      # addBlock / removeBlock
app/admin/yachts/page.tsx              # list
app/admin/yachts/[id]/page.tsx         # edit form
app/admin/yachts/actions.ts            # upsertYacht / toggleActive
app/admin/services/page.tsx            # catalog + options + per-yacht toggles
app/admin/services/actions.ts          # CRUD services/options/yacht_services
components/admin/*                      # shell, nav, table, fields
lib/admin/queries.ts                   # admin reads (service client)
```

## Tasks (each ends with build/tsc clean + commit)
1. **Auth infra** — `lib/supabase/middleware.ts` (updateSession) + `middleware.ts` (matcher `/admin/:path*`, redirect unauthenticated to login except the login page). Login page + `signIn` action (`supabase.auth.signInWithPassword`, redirect to `/admin`). `signOut` action.
2. **Shell + dashboard** — `app/admin/layout.tsx` gets the user via server client; if none, redirect to login (defense in depth). Sidebar nav (Dashboard, Reservations, Availability, Yachts, Services) + sign-out. Dashboard cards: pending count, confirmed count, upcoming charters (next 90 days), sum of deposits collected.
3. **Reservations** — list (date, customer, yacht, status, deposit) newest first; detail shows line items + customer + status; `cancelBooking(id)` sets status `cancelled` and deletes the `booked` availability block for that booking (note match). `revalidatePath`.
4. **Availability** — per-yacht month calendar; click a free day to add a 1-day-plus block (choose end), or remove an existing manual block; `addBlock(yachtId,start,end,reason,note)` / `removeBlock(id)`. Confirmed-booking blocks shown read-only.
5. **Yachts CRUD** — list + edit form for every field (copy, hero image URL, base price €→cents, included/extra-guest, max guests, min/max nights, season, deposit mode+value, active, sort). `upsertYacht`. New-yacht create.
6. **Services CRUD** — manage global services + options (name/price/active/sort), add/remove; per-yacht toggle which services apply + price override. Actions for each.

## Money in forms
Inputs show euros (e.g. 20000.00); convert to integer cents on save (`Math.round(euros*100)`); display via `formatEUR`.

## Security notes
- Service-role key required (already needed for booking writes).
- Admin user must be created in Supabase dashboard (Authentication → Add user).
- RLS authenticated policies remain permissive (only admins can authenticate). Tighten to an allowlist later if staff accounts diverge from admins.

## Self-review against spec §Admin Panel
Login ✔ · Dashboard ✔ · Reservations + manage deposits/status ✔ · Availability calendar drives public picker ✔ · Yachts full CRUD ✔ · Services catalog + per-yacht ✔. Settings page deferred (Stripe keys are env; not required for v1 operation).
