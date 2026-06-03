import "server-only";
import { Resend } from "resend";
import { formatEUR } from "@/lib/money";
import type { ConfirmedBooking } from "@/lib/booking/booking-confirm";
import { googleCalendarUrl } from "@/lib/calendar/ics";
import { bookingToEvent } from "@/lib/calendar/booking-event";

const FROM = "Hanstaiger <onboarding@resend.dev>"; // replace with verified domain in prod

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function summary(b: ConfirmedBooking): string {
  return `
    <table style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#111213">
      <tr><td style="padding:4px 16px 4px 0;color:#83868e">Dates</td><td>${b.start_date} → ${b.end_date}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#83868e">Guests</td><td>${b.guests}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#83868e">Total</td><td>${formatEUR(b.total)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#83868e">Deposit paid</td><td><strong>${formatEUR(b.deposit)}</strong></td></tr>
    </table>`;
}

/** Best-effort: email failures must never fail the webhook. */
export async function sendClientConfirmation(b: ConfirmedBooking): Promise<void> {
  const resend = client();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY unset — skipping client confirmation");
    return;
  }
  const event = bookingToEvent({
    id: b.id,
    start_date: b.start_date,
    end_date: b.end_date,
    guests: b.guests,
    customer_name: b.customer_name,
    yachtName: "Hanstaiger X1",
  });
  const gcal = googleCalendarUrl(event);
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const icsLink = base
    ? `&nbsp;·&nbsp;<a href="${base}/api/calendar/booking/${b.id}">Download .ics</a>`
    : "";

  try {
    await resend.emails.send({
      from: FROM,
      to: b.customer_email,
      subject: "Your Hanstaiger reservation is confirmed",
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif">
          <h2 style="font-weight:400">Reservation confirmed</h2>
          <p>Dear ${b.customer_name}, your charter is secured. The balance is due on board.</p>
          ${summary(b)}
          <p style="margin-top:16px"><a href="${gcal}">Add to Google Calendar</a>${icsLink}</p>
          <p style="color:#83868e;font-size:12px">Hanstaiger · ${b.id}</p>
        </div>`,
    });
  } catch (err) {
    console.error("[email] client confirmation failed", err);
  }
}

export async function sendAdminAlert(b: ConfirmedBooking): Promise<void> {
  const resend = client();
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!resend || !to) {
    console.warn("[email] RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL unset — skipping admin alert");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `New booking · ${b.customer_name} · ${formatEUR(b.deposit)} deposit`,
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif">
          <h2 style="font-weight:400">New paid reservation</h2>
          <p>${b.customer_name} &lt;${b.customer_email}&gt;</p>
          ${summary(b)}
        </div>`,
    });
  } catch (err) {
    console.error("[email] admin alert failed", err);
  }
}
