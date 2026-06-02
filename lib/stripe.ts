import "server-only";
import Stripe from "stripe";

/** Server-side Stripe client. Secret key is server-only (never bundled). */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  // Pin to the SDK's bundled API version; override here if the dashboard differs.
  typescript: true,
});
