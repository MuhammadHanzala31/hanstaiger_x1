import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getDraftId } from "@/lib/booking/draft-cookie";
import { formatEUR } from "@/lib/money";
import { googleCalendarUrl } from "@/lib/calendar/ics";
import { bookingToEvent } from "@/lib/calendar/booking-event";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const client = createServiceClient();

  // Preferred: look the booking up by the Stripe session id from success_url.
  if (sessionId) {
    const { data: booking } = await client
      .from("bookings")
      .select("id, status, start_date, end_date, guests, total, deposit, customer_name, yachts(name)")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (booking) {
      const confirmed = booking.status === "confirmed";
      const yachtName =
        (booking.yachts as unknown as { name: string } | null)?.name ?? "Hanstaiger";
      return (
        <Shell
          eyebrow={confirmed ? "Reservation confirmed" : "Finalizing"}
          title={confirmed ? "You're all set" : "We're confirming your payment"}
        >
          <Summary
            dates={`${booking.start_date} → ${booking.end_date}`}
            guests={booking.guests}
            total={booking.total}
            deposit={booking.deposit}
            depositLabel={confirmed ? "Deposit paid" : "Deposit due"}
          />
          {confirmed && (
            <AddToCalendar
              googleUrl={googleCalendarUrl(
                bookingToEvent({
                  id: booking.id,
                  start_date: booking.start_date,
                  end_date: booking.end_date,
                  guests: booking.guests,
                  customer_name: booking.customer_name,
                  yachtName,
                }),
              )}
              icsUrl={`/api/calendar/booking/${booking.id}`}
            />
          )}
          <p className="t-caption3 max-w-sm text-grey-500">
            {confirmed
              ? "A confirmation email is on its way. The balance is due on board."
              : "This can take a few seconds. We'll email your confirmation as soon as the payment settles."}
          </p>
          <Back />
        </Shell>
      );
    }
  }

  // Fallback (e.g. returned via cancel): show the current draft totals.
  const draftId = await getDraftId();
  let total = 0;
  let deposit = 0;
  let dates: string | null = null;
  if (draftId) {
    const { data } = await client
      .from("booking_drafts")
      .select("start_date, end_date, computed_total, computed_deposit")
      .eq("id", draftId)
      .maybeSingle();
    if (data) {
      total = data.computed_total;
      deposit = data.computed_deposit;
      dates =
        data.start_date && data.end_date
          ? `${data.start_date} → ${data.end_date}`
          : null;
    }
  }

  return (
    <Shell eyebrow="Almost there" title="Review your reservation">
      <Summary dates={dates} total={total} deposit={deposit} depositLabel="Deposit due" />
      <Back />
    </Shell>
  );
}

function Shell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-grey-900 px-6 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="t-h3 text-white">{title}</h1>
      {children}
    </main>
  );
}

function Summary({
  dates,
  guests,
  total,
  deposit,
  depositLabel,
}: {
  dates: string | null;
  guests?: number;
  total: number;
  deposit: number;
  depositLabel: string;
}) {
  return (
    <div className="frost w-full max-w-sm rounded-md border border-white/10 p-6 text-left">
      {dates && <Row label="Dates" value={dates} />}
      {guests != null && <Row label="Guests" value={String(guests)} />}
      <Row label="Total" value={formatEUR(total)} />
      <Row label={depositLabel} value={formatEUR(deposit)} highlight />
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 last:border-0">
      <span className="t-body4 text-grey-400">{label}</span>
      <span className={`t-body3 ${highlight ? "text-orange-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function Back() {
  return (
    <Link
      href="/"
      className="t-button1 rounded-sm border border-white/20 px-6 py-3 text-white transition-colors hover:bg-white/10"
    >
      Back to start
    </Link>
  );
}

function AddToCalendar({ googleUrl, icsUrl }: { googleUrl: string; icsUrl: string }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="t-button1 flex-1 rounded-[2px] bg-orange-400 px-5 py-3 text-center text-white transition-colors hover:bg-orange-500"
      >
        Add to Google Calendar
      </a>
      <a
        href={icsUrl}
        className="t-button1 flex-1 rounded-[2px] border border-white/25 px-5 py-3 text-center text-white transition-colors hover:bg-white/10"
      >
        Download .ics
      </a>
    </div>
  );
}
