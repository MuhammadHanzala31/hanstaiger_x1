import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface ConfirmedBooking {
  id: string;
  yacht_id: string;
  customer_name: string;
  customer_email: string;
  start_date: string;
  end_date: string;
  guests: number;
  total: number;
  deposit: number;
  currency: string;
  status: string;
}

/**
 * Idempotently confirm a paid booking: flip status, record the payment intent,
 * and block the dates so the calendar excludes them. Safe to call more than
 * once (Stripe may deliver a webhook event multiple times).
 */
export async function confirmBooking(
  bookingId: string,
  paymentIntentId: string | null,
): Promise<ConfirmedBooking | null> {
  const client = createServiceClient();

  const { data: existing } = await client
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();
  if (!existing) return null;

  // Already processed — return as-is, do not insert a duplicate block.
  if (existing.status === "confirmed") return existing as ConfirmedBooking;

  const { data: updated } = await client
    .from("bookings")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      stripe_payment_intent: paymentIntentId,
    })
    .eq("id", bookingId)
    .select("*")
    .single();

  await client.from("availability_blocks").insert({
    yacht_id: existing.yacht_id,
    start_date: existing.start_date,
    end_date: existing.end_date,
    reason: "booked",
    note: `Booking ${bookingId}`,
  });

  // These dates are now taken — any other booking still awaiting payment for
  // an overlapping range can never be paid into a valid slot, so cancel it.
  await client
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("yacht_id", existing.yacht_id)
    .eq("status", "pending_payment")
    .neq("id", bookingId)
    .lt("start_date", existing.end_date)
    .gt("end_date", existing.start_date);

  return updated as ConfirmedBooking;
}
