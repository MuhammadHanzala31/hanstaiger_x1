"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";
import { validateRange } from "@/lib/availability";
import { loadYachtById, loadDraftRow, loadBlockedRanges } from "./db";
import { getDraftId } from "./draft-cookie";
import { buildLineItems } from "./checkout-core";
import { shortDate } from "./stepValue";
import { formatTotal } from "@/lib/money";

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export type CheckoutResult = { url: string } | { error: string };

async function baseUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function createCheckoutSession(customer: Customer): Promise<CheckoutResult> {
  const client = createServiceClient();
  const draftId = await getDraftId();
  if (!draftId) return { error: "no_draft" };

  const draft = await loadDraftRow(client, draftId);
  if (!draft || !draft.start_date || !draft.end_date) return { error: "incomplete" };

  const yacht = await loadYachtById(client, draft.yacht_id);
  if (!yacht) return { error: "no_draft" };

  // Re-validate availability at the last moment (dates may have been taken).
  const blocked = await loadBlockedRanges(client, yacht.id);
  const range = validateRange(
    draft.start_date,
    draft.end_date,
    {
      minNights: yacht.minNights,
      maxNights: yacht.maxNights,
      seasonStart: yacht.seasonStart,
      seasonEnd: yacht.seasonEnd,
    },
    blocked,
  );
  if (!range.ok) return { error: range.reason };

  const snap = buildLineItems(yacht, draft.guests, draft.selected_options ?? []);

  // Create the pending booking with an immutable price snapshot.
  const { data: booking, error } = await client
    .from("bookings")
    .insert({
      draft_id: draft.id,
      yacht_id: yacht.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      start_date: draft.start_date,
      end_date: draft.end_date,
      guests: draft.guests,
      line_items: snap.lineItems,
      total: snap.total,
      deposit: snap.deposit,
      currency: yacht.currency,
      status: "pending_payment",
    })
    .select("id")
    .single();
  if (error || !booking) return { error: "booking_failed" };

  const base = await baseUrl();
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: customer.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: yacht.currency.toLowerCase(),
          unit_amount: snap.deposit,
          // Spell out deposit vs total so the amount doesn't look like a different price.
          product_data: {
            name: `${yacht.depositMode === "percent" ? `${yacht.depositValue}% deposit` : "Deposit"} · ${yacht.name}`,
            description: `Total charter rate ${formatTotal(snap.total, yacht.currency)} · ${shortDate(draft.start_date)} → ${shortDate(draft.end_date)} · ${draft.guests} guests`,
          },
        },
      },
    ],
    metadata: { booking_id: booking.id },
    success_url: `${base}/book/${yacht.slug}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/book/${yacht.slug}`,
  });

  await client
    .from("bookings")
    .update({ stripe_session_id: session.id })
    .eq("id", booking.id);

  if (!session.url) return { error: "stripe_no_url" };
  return { url: session.url };
}
