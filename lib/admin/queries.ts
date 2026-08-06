import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface BookingListItem {
  id: string;
  customer_name: string;
  customer_email: string;
  start_date: string;
  end_date: string;
  guests: number;
  total: number;
  deposit: number;
  status: string;
  created_at: string;
  yachts: { name: string } | null;
}

export async function getDashboardStats() {
  const client = createServiceClient();
  const { data } = await client
    .from("bookings")
    .select("status, deposit, start_date");
  const rows = data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  return {
    pending: rows.filter((r) => r.status === "pending_payment").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    upcoming: rows.filter((r) => r.status === "confirmed" && r.start_date >= today).length,
    depositsCollected: rows
      .filter((r) => r.status === "confirmed")
      .reduce((s, r) => s + (r.deposit ?? 0), 0),
  };
}

export async function listBookings(): Promise<BookingListItem[]> {
  const client = createServiceClient();
  const { data } = await client
    .from("bookings")
    .select(
      "id, customer_name, customer_email, start_date, end_date, guests, total, deposit, status, created_at, yachts(name)",
    )
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as BookingListItem[];
}

export async function getBooking(id: string) {
  const client = createServiceClient();
  const { data } = await client
    .from("bookings")
    .select("*, yachts(name, slug)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export type CalendarEventKind = "confirmed" | "pending" | "hold" | "maintenance";

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  label: string;
  start_date: string;
  end_date: string;
  href: string | null;
}

/**
 * Bookings (confirmed + pending) and manual blocks (holds + maintenance) for
 * one yacht, overlapping [rangeStart, rangeEnd), merged into a single list
 * for the reservations calendar. The auto-created 'booked' block for each
 * confirmed booking is skipped — the booking itself already represents it.
 */
export async function getCalendarEvents(
  yachtId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<CalendarEvent[]> {
  const client = createServiceClient();

  const [{ data: bookings }, { data: blocks }] = await Promise.all([
    client
      .from("bookings")
      .select("id, customer_name, start_date, end_date, status")
      .eq("yacht_id", yachtId)
      .in("status", ["confirmed", "pending_payment"])
      .lt("start_date", rangeEnd)
      .gt("end_date", rangeStart),
    client
      .from("availability_blocks")
      .select("id, reason, note, start_date, end_date")
      .eq("yacht_id", yachtId)
      .in("reason", ["hold", "maintenance"])
      .lt("start_date", rangeEnd)
      .gt("end_date", rangeStart),
  ]);

  const bookingEvents: CalendarEvent[] = (bookings ?? []).map((b) => ({
    id: `booking-${b.id}`,
    kind: b.status === "confirmed" ? "confirmed" : "pending",
    label: b.customer_name,
    start_date: b.start_date,
    end_date: b.end_date,
    href: `/admin/reservations/${b.id}`,
  }));

  const blockEvents: CalendarEvent[] = (blocks ?? []).map((b) => ({
    id: `block-${b.id}`,
    kind: b.reason as "hold" | "maintenance",
    label: b.note || (b.reason === "hold" ? "Hold" : "Maintenance"),
    start_date: b.start_date,
    end_date: b.end_date,
    href: null,
  }));

  return [...bookingEvents, ...blockEvents];
}

export async function listYachts() {
  const client = createServiceClient();
  const { data } = await client.from("yachts").select("*").order("sort_order");
  return data ?? [];
}

export async function getYacht(id: string) {
  const client = createServiceClient();
  const { data } = await client.from("yachts").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function listServicesWithOptions() {
  const client = createServiceClient();
  const { data } = await client
    .from("services")
    .select("*, service_options(*)")
    .order("sort_order");
  return data ?? [];
}

export async function listYachtServiceLinks(yachtId: string) {
  const client = createServiceClient();
  const { data } = await client
    .from("yacht_services")
    .select("*")
    .eq("yacht_id", yachtId);
  return data ?? [];
}
