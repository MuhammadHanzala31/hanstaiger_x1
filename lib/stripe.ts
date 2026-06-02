import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazily-constructed server-side Stripe client. Lazy so the app can build and
 * boot without `STRIPE_SECRET_KEY` set; the error only surfaces when checkout
 * or the webhook is actually exercised.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, { typescript: true });
  return _stripe;
}
