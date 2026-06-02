# Local Stripe webhook testing

Phase 3 confirms bookings from the Stripe webhook (not the browser redirect), so
to test the full flow locally you must forward Stripe events to the dev server.

## 1. Env (`.env.local`)
```
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → API keys → service_role>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # printed by `stripe listen` (see below)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=re_...                  # optional; emails are skipped if unset
ADMIN_NOTIFICATION_EMAIL=you@example.com
# NEXT_PUBLIC_SITE_URL=http://localhost:3000   # optional; falls back to request origin
```

## 2. Run
```
npm run dev
# in a second terminal:
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET and restart `npm run dev`
```

## 3. Pay
Walk the wizard to checkout, then on Stripe Checkout use the test card:
```
4242 4242 4242 4242 · any future expiry · any CVC · any postal code
```
On success Stripe redirects to `/book/x1/confirmation?session_id=...` and fires
`checkout.session.completed`, which confirms the booking, blocks the dates, and
sends the emails.

## Notes
- The deposit amount is recomputed server-side right before the session is created.
- The webhook is idempotent — duplicate events won't double-book or double-block.
- Use the Stripe test dashboard to inspect payments and resend events.
