import { createServiceClient } from "@/lib/supabase/service";
import { buildCalendar } from "@/lib/calendar/ics";
import { bookingToEvent } from "@/lib/calendar/booking-event";

export const runtime = "nodejs";

/**
 * Subscribable ICS feed of all confirmed bookings for the team to add once to
 * Google/Apple/Outlook. Protected by a secret token (CALENDAR_FEED_TOKEN).
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const expected = process.env.CALENDAR_FEED_TOKEN;
  if (!expected || token !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = createServiceClient();
  const { data } = await client
    .from("bookings")
    .select("id, start_date, end_date, guests, customer_name, yachts(name)")
    .eq("status", "confirmed")
    .order("start_date");

  const events = (data ?? []).map((b) =>
    bookingToEvent({
      ...b,
      yachtName: (b.yachts as unknown as { name: string } | null)?.name ?? "Hanstaiger",
    }),
  );

  return new Response(buildCalendar(events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="hanstaiger-bookings.ics"',
    },
  });
}
