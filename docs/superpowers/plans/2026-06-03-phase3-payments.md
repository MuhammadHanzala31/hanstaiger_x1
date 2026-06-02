# Phase 3 — Payments (Stripe + Webhook + Email) Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or execute inline with TDD where logic is pure. Checkbox steps.

**Goal:** Turn a completed draft into a paid, confirmed reservation: create a `bookings` row, collect the **deposit** via Stripe Checkout, and on the Stripe webhook confirm the booking, block the dates, and email the client + admin.

**Architecture:** A Server Action converts the cookie's draft → a `pending_payment` booking (line-item snapshot) and creates a Stripe Checkout Session for the deposit only, returning the redirect URL. The `checkout.session.completed` webhook (signature-verified, raw body) is the source of truth: it flips the booking to `confirmed`, inserts an `availability_block(reason='booked')`, clears the draft cookie association, and triggers Resend emails. Money stays server-authoritative — the deposit is recomputed before the session is created.

**Tech Stack:** `stripe` (Node SDK), Resend (`resend`), Next.js Route Handler for the webhook. Service-role Supabase client for all booking writes.

**Env required (add real values to `.env.local`):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, and `NEXT_PUBLIC_SITE_URL` (fallback to request origin).

---

## File Structure

```
lib/stripe.ts                          # Stripe server client (singleton)
lib/email.ts                           # Resend client + sendClientConfirmation/sendAdminAlert
lib/booking/checkout.ts                # 'use server' createCheckoutSession(customer)
lib/booking/booking-confirm.ts         # confirmBooking(sessionOrBookingId) used by webhook
app/api/stripe/webhook/route.ts        # POST: verify sig, confirm booking, block, email
app/book/[slug]/confirmation/page.tsx  # rewrite: show real booking by session_id
tests/unit/line-items.test.ts          # snapshot line-items builder (pure, TDD)
```

---

## Task 1: Stripe client + line-item snapshot (TDD for the pure part)

- [ ] **Step 1:** `npm install stripe resend`.
- [ ] **Step 2 (TDD):** `tests/unit/line-items.test.ts` for a pure `buildLineItems(yacht, guests, options)` reusing `repriceDraft` → returns `{ lineItems, total, deposit }` where `lineItems` is the persisted snapshot array. Assert X1, 6 guests, Dinner(120000) → total 3120000, deposit 624000, and the snapshot includes Charter/Additional guests/Dinner. Run → FAIL. (If `repriceDraft` already returns exactly this, `buildLineItems` is a thin alias — still test it.)
- [ ] **Step 3:** Implement `buildLineItems` in `lib/booking/checkout.ts` (exported, pure). Run → PASS.
- [ ] **Step 4:** `lib/stripe.ts`:
```ts
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```
- [ ] **Step 5:** Commit `feat(payments): add stripe client and line-item snapshot`.

## Task 2: createCheckoutSession server action

- [ ] **Step 1:** In `lib/booking/checkout.ts` add `"use server"` `createCheckoutSession(customer: {name,email,phone})`:
  1. Load draft (cookie + service client); require `start_date`,`end_date`. Else return `{ error: 'incomplete' }`.
  2. Load yacht; re-validate range via `validateRange` against current `availability_blocks`; on failure return `{ error: reason }`.
  3. `buildLineItems` → total/deposit/snapshot.
  4. Insert `bookings` row: status `pending_payment`, customer fields, dates, guests, `line_items` snapshot, total, deposit, currency.
  5. Create Stripe Checkout Session: `mode: 'payment'`, single `line_items` entry `price_data` (currency `eur`, `unit_amount: deposit`, `product_data.name: 'Deposit · ' + yacht.name`), `customer_email`, `metadata.booking_id`, `success_url = ${base}/book/${slug}/confirmation?session_id={CHECKOUT_SESSION_ID}`, `cancel_url = ${base}/book/${slug}`.
  6. Update booking with `stripe_session_id`. Return `{ url }`.
  - `base` from `NEXT_PUBLIC_SITE_URL` || request `headers()` origin.
- [ ] **Step 2:** Commit `feat(payments): create deposit checkout session from draft`.

## Task 3: Webhook — confirm, block, email

- [ ] **Step 1:** `lib/booking/booking-confirm.ts`: `confirmBooking(bookingId, paymentIntentId)` (service client): set `status='confirmed'`, `confirmed_at=now()`, `stripe_payment_intent`; insert `availability_blocks(yacht_id, start_date, end_date, reason='booked', note='Booking '+id)`; return the booking. Idempotent: if already confirmed, no-op (skip duplicate block).
- [ ] **Step 2:** `app/api/stripe/webhook/route.ts` (POST): read raw `await req.text()`, get `stripe-signature` header, `stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)`. On `checkout.session.completed`: extract `booking_id` from `metadata`, `payment_intent`; call `confirmBooking`; then `sendClientConfirmation` + `sendAdminAlert`. Always return 200 on handled, 400 on signature failure. Export `export const runtime = 'nodejs'`.
- [ ] **Step 3:** Commit `feat(payments): stripe webhook confirms booking and blocks dates`.

## Task 4: Resend emails

- [ ] **Step 1:** `lib/email.ts`: `const resend = new Resend(process.env.RESEND_API_KEY!)`. `sendClientConfirmation(booking)` → branded HTML to `booking.customer_email` (yacht, dates, guests, total, deposit paid). `sendAdminAlert(booking)` → to `process.env.ADMIN_NOTIFICATION_EMAIL`. Both wrapped in try/catch that logs and never throws (email failure must not fail the webhook). If `RESEND_API_KEY` is unset, log and skip.
- [ ] **Step 2:** Commit `feat(payments): client confirmation and admin alert emails via Resend`.

## Task 5: Wire UI + real confirmation page

- [ ] **Step 1:** `DetailsForm` `onProceed` → call `createCheckoutSession`; on `{url}` `window.location.assign(url)`; on `{error}` show inline message (e.g., dates no longer available → ask to revisit step). Update `BookingWizard` handler accordingly.
- [ ] **Step 2:** Rewrite `confirmation/page.tsx`: read `?session_id`; look up booking by `stripe_session_id` (service client); if `confirmed` show success ("Reservation confirmed", dates, deposit paid, balance due on board); if still `pending_payment` show "finalizing" with note that confirmation arrives by email. Fall back to draft summary if no session_id (cancelled return).
- [ ] **Step 3:** `npm run build`, `npx tsc --noEmit`, `npm run test:unit` all clean. Commit `feat(payments): wire checkout redirect and real confirmation page`.

## Task 6: Verify + docs

- [ ] **Step 1:** Document local webhook testing in `docs/` note: `stripe listen --forward-to localhost:3000/api/stripe/webhook` and Stripe test card `4242 4242 4242 4242`.
- [ ] **Step 2:** Build clean; commit.

---

## Self-Review (against spec §Stripe/Webhook/Email)

- Checkout Session for the **deposit only**, `booking_id` in metadata → Task 2. ✔
- Webhook is the source of truth: confirm + block dates + email → Task 3. ✔ (idempotent)
- Signature verified, raw body, nodejs runtime → Task 3. ✔
- Client confirmation + admin alert, non-fatal on failure → Task 4. ✔
- Deposit recomputed server-side before session; availability re-validated → Task 2. ✔
- Booking snapshots line items (no retroactive price drift) → Task 1/2. ✔
- Out of scope (correct): balance/full payment, refunds automation (admin-manual in Phase 4).
