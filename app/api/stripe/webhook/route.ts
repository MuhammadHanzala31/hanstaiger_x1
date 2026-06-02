import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { confirmBooking } from "@/lib/booking/booking-confirm";
import { sendClientConfirmation, sendAdminAlert } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET unset");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no_signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    const paymentIntent =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    if (bookingId) {
      const booking = await confirmBooking(bookingId, paymentIntent);
      if (booking) {
        await Promise.all([
          sendClientConfirmation(booking),
          sendAdminAlert(booking),
        ]);
      }
    }
  }

  return NextResponse.json({ received: true });
}
