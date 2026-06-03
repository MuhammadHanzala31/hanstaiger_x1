import { createServiceClient } from "@/lib/supabase/service";
import { buildCalendar } from "@/lib/calendar/ics";
import { bookingToEvent } from "@/lib/calendar/booking-event";

export const runtime = "nodejs";

/** Download a single booking as an .ics file (Apple/Outlook/Google import). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = createServiceClient();
  const { data } = await client
    .from("bookings")
    .select("id, start_date, end_date, guests, customer_name, status, yachts(name)")
    .eq("id", id)
    .maybeSingle();

  if (!data || data.status === "cancelled") {
    return new Response("Not found", { status: 404 });
  }

  const yachtName =
    (data.yachts as unknown as { name: string } | null)?.name ?? "Hanstaiger";
  const ics = buildCalendar([bookingToEvent({ ...data, yachtName })]);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="hanstaiger-${id}.ics"`,
    },
  });
}
