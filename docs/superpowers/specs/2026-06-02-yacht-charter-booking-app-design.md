# Hanstaiger X1 — Yacht Charter Booking App — Design

**Date:** 2026-06-02
**Status:** Approved (brainstorming)

## Overview

A luxury yacht-charter booking application for Hanstaiger, built on the existing
Next.js / Supabase / Vercel-class stack. It delivers a pixel-perfect, multi-step
booking flow (matching the provided Figma design and prototype), a fully dynamic
admin panel for managing yachts, services, pricing, availability, and reservations,
and Stripe Checkout for collecting a deposit. No third-party booking dashboards —
everything lives in one place, looks like Hanstaiger, and is fully under the team's
control.

## Stack

- **Framework:** Next.js (App Router) — Server Components + Server Actions.
- **Backend:** Supabase (Postgres, Auth, Row Level Security).
- **Payments:** Stripe Checkout (deposit only) + Stripe webhook.
- **Email:** Resend (client confirmation + admin alert).
- **Money:** all amounts stored as integer **cents**; currency **EUR**.
- **Deployment:** local-first; target TBD (Vercel-compatible).
- **Design fidelity:** pixel-perfect, sourced via the Figma MCP server.

## Confirmed Requirements

- **Scope:** multi-yacht from day one; fully admin-managed catalog.
- **Deposit:** per-yacht, admin chooses percentage **or** flat amount.
- **Admin auth:** Supabase Auth, email + password; `/admin/*` guarded.
- **Availability:** range select (departure → return), per-day blocking,
  per-yacht `min_nights`/`max_nights` and `season_start`/`season_end`.
- **Services:** global catalog (with options), per-yacht toggle + price override.
- **Notifications:** client confirmation email + admin new-booking alert on paid deposit.

## Architecture (Option A — Server-authoritative drafts)

The 4-step wizard renders as client components for interactivity, but each step
writes to a `booking_drafts` row via Server Actions. **Pricing and availability are
computed and re-validated server-side at every step and again immediately before
creating the Stripe Checkout Session — the client never decides the price.** A Stripe
webhook (not the browser redirect) is the source of truth that flips a booking to
`confirmed`, blocks the dates, and fires emails.

Rationale: prices and availability are money-critical and must be authoritative on
the server. Drafts enable resume and give admins visibility into abandoned bookings.
Clean RLS story: anon reads only the active public catalog/availability; all
booking writes go through server-role Server Actions.

## Data Model (Supabase / Postgres)

All prices are integer cents. Currency EUR.

### `yachts`
`id, slug, name, tagline, description, hero_image, gallery[],
base_price, included_guests, extra_guest_price, max_guests,
min_nights, max_nights, deposit_mode ('percent'|'flat'), deposit_value,
season_start, season_end, currency, is_active, sort_order`

### `services` (global catalog)
`id, name, category, description, icon, is_active, sort_order`

### `service_options` (e.g. Breakfast/Lunch/Dinner under Private chef)
`id, service_id, name, price, is_active, sort_order`

### `yacht_services` (which services a yacht offers + price override)
`id, yacht_id, service_id, price_override (nullable), is_active`

### `availability_blocks` (admin-managed unavailable days)
`id, yacht_id, start_date, end_date, reason ('booked'|'maintenance'|'hold'), note`

### `booking_drafts` (server-side wizard state)
`id (uuid), yacht_id, start_date, end_date, guests,
selected_options[] (option ids + captured prices),
computed_total, computed_deposit, status ('draft'), created_at, expires_at`

### `bookings` (a draft that went to checkout)
`id (uuid), draft_id, yacht_id, customer_name, customer_email, customer_phone,
start_date, end_date, guests, line_items (jsonb snapshot),
total, deposit, currency, stripe_session_id, stripe_payment_intent,
status ('pending_payment'|'confirmed'|'cancelled'|'expired'),
created_at, confirmed_at`

### `admin_users`
Backed by Supabase Auth; role flag / allowlist.

### Key data decisions
- Integer cents everywhere; no floating-point money.
- Bookings **snapshot** their line items + prices in `line_items` jsonb, so later
  admin price changes never retroactively alter a placed booking.
- A confirmed booking auto-creates an `availability_block(reason='booked')` so the
  date picker blocks it for everyone.
- RLS: anon reads active yachts/services/availability only; draft/booking writes via
  service-role Server Actions; `bookings` and admin tables readable only by
  authenticated admins.

## Booking Flow (4-step wizard, `/book/[yacht-slug]`)

Mirrors the Figma screens exactly, including live "Total amount" and `NN/04` step
indicators.

- **Step 00 — Intro** ("Book the X1 experience"): hero, intro copy, CTA. Content from
  the `yachts` row.
- **Step 01 — Select your dates**: custom range picker (departure → return). Blocked
  days from `availability_blocks` + confirmed bookings are disabled. Enforces
  min/max nights and season window. Live total. Next disabled until valid range.
- **Step 02 — Choose your guests**: stepper starting at `included_guests`; each extra
  guest adds `extra_guest_price`; capped at `max_guests`. Live total.
- **Step 03 — Enhance your experience**: service categories, expandable, multi-select
  options with prices, "Clear all", skippable. "Proceed to checkout".
- **Step 04 — Lock in your reservation**: capture customer name/email/phone, show
  deposit terms, create Stripe Checkout Session and redirect.

### Pricing (server-side, authoritative)
```
nights       = end_date - start_date
base         = yacht.base_price
guest_extra  = max(0, guests - included_guests) * extra_guest_price
services_sum = Σ selected option prices (with yacht overrides)
total        = base + guest_extra + services_sum
deposit      = mode == 'percent' ? round(total * value / 100) : value
```
The client shows a total for UX; the Server Action recomputes from the DB on every
step and again right before creating the Stripe session. If availability changed
mid-flow (dates got booked), the user is sent back to Step 01.

### State & resume
Draft id in an httpOnly cookie. Drafts have `expires_at` (~60 min); a cleanup removes
stale drafts.

## Admin Panel (`/admin`, Supabase Auth protected)

Styled like Hanstaiger; fully dynamic (no redeploy to change content/pricing/availability).

- **Login** — Supabase Auth email + password; middleware guards `/admin/*`.
- **Dashboard** — incoming reservations at a glance (pending vs confirmed, upcoming
  charters, deposit totals).
- **Reservations** — list + detail: customer info, dates, guests, services, line-item
  breakdown, deposit & payment status; mark cancelled/refunded (cancelling frees the
  availability block).
- **Availability calendar** — per-yacht; click/drag to block/unblock days, confirmed
  bookings overlaid. Drives the public date picker.
- **Yachts** — full CRUD: copy, images, base price, included/extra-guest pricing, max
  guests, min/max nights, season window, deposit mode + value, active toggle, order.
- **Services** — manage global catalog + options + prices; per-yacht toggle + price
  override.
- **Settings** — Stripe mode/status (keys via env), admin email recipients.

## Stripe, Webhook, Email

- **Checkout:** Server Action creates a Checkout Session for the **deposit** line item
  only, with `booking_id` in metadata. Success → `/book/[yacht]/confirmation`;
  cancel → back to Step 04.
- **Webhook:** `/api/stripe/webhook` verifies signature; on
  `checkout.session.completed` flips booking → `confirmed`, creates the
  `availability_block`, triggers emails. Source of truth (never the client redirect).
- **Email (Resend):** client confirmation + admin new-booking alert, brand-styled.

## Security

- RLS as described; webhook signature verified.
- Prices and availability never trusted from the client.
- Admin routes auth-gated via middleware.
- Stripe keys and service-role keys server-only (env).

## Testing

- **Vitest** — pricing, availability, and deposit logic as pure, heavily-tested
  functions. TDD.
- **Playwright** — full booking flow E2E using Stripe test mode.

## Project Structure

```
app/        public booking flow, /admin, /api (stripe webhook)
lib/        pricing, availability, supabase clients, stripe, email
components/ shared UI (calendar, stepper, service picker, etc.)
supabase/   migrations
tests/      vitest unit + playwright e2e
```

## Out of Scope (v1)

- Full payment (balance) collection — deposit only for v1.
- Multi-currency — EUR only.
- Customer accounts/login — booking is guest checkout.
- Refund automation beyond manual admin marking.
```
