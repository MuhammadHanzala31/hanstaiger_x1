import Link from "next/link";
import { headers } from "next/headers";
import { listBookings, listYachts, getCalendarEvents } from "@/lib/admin/queries";
import { formatEUR } from "@/lib/money";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BookingsCalendar } from "@/components/admin/BookingsCalendar";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function feedUrl(): Promise<string | null> {
  const token = process.env.CALENDAR_FEED_TOKEN;
  if (!token) return null;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (base) return `${base}/api/calendar/feed?token=${token}`;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/api/calendar/feed?token=${token}`;
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ yacht?: string; month?: string }>;
}) {
  const [bookings, yachts, feed, { yacht: yachtParam, month: monthParam }] = await Promise.all([
    listBookings(),
    listYachts(),
    feedUrl(),
    searchParams,
  ]);

  const yacht = yachts.find((y) => y.id === yachtParam) ?? yachts[0];

  const now = new Date();
  const [yearStr, monthStr] = (monthParam ?? "").split("-");
  const year = Number(yearStr) || now.getUTCFullYear();
  const month = monthStr ? Number(monthStr) - 1 : now.getUTCMonth();

  const rangeStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1));
  const prevMonthDate = new Date(Date.UTC(year, month - 1, 1));
  const rangeEnd = iso(nextMonthDate);

  const events = yacht ? await getCalendarEvents(yacht.id, rangeStart, rangeEnd) : [];

  const monthParamFor = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthHref = (d: Date) =>
    `/admin/reservations?yacht=${yacht?.id ?? ""}&month=${monthParamFor(d)}`;

  return (
    <div>
      <h1 className="t-h3 mb-1 text-white">Reservations</h1>
      <p className="t-body3 mb-6 text-grey-400">{bookings.length} total.</p>

      {yachts.length > 0 && (
        <div className="mb-4 flex gap-2">
          {yachts.map((y) => (
            <Link
              key={y.id}
              href={`/admin/reservations?yacht=${y.id}&month=${monthParamFor(new Date(Date.UTC(year, month, 1)))}`}
              className={`t-button2 rounded-sm px-3 py-2 ${
                y.id === yacht?.id ? "bg-white text-grey-900" : "border border-white/20 text-grey-300"
              }`}
            >
              {y.name}
            </Link>
          ))}
        </div>
      )}

      {yacht && (
        <div className="mb-8">
          <BookingsCalendar
            year={year}
            month={month}
            events={events}
            prevHref={monthHref(prevMonthDate)}
            nextHref={monthHref(nextMonthDate)}
          />
        </div>
      )}

      <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="eyebrow mb-2">Team calendar feed</p>
        {feed ? (
          <>
            <p className="t-caption3 mb-2 text-grey-400">
              Add this once to Google/Apple/Outlook — all confirmed bookings sync automatically.
            </p>
            <code className="t-body4 block break-all rounded-sm bg-grey-900 px-3 py-2 text-grey-200">
              {feed}
            </code>
          </>
        ) : (
          <p className="t-caption3 text-grey-400">
            Set <code className="text-grey-200">CALENDAR_FEED_TOKEN</code> in the environment to enable the subscribable feed.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr className="t-caption1 uppercase text-grey-400">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Yacht</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Deposit</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/reservations/${b.id}`} className="block">
                    <span className="t-body3 text-white">{b.customer_name}</span>
                    <span className="t-caption3 block text-grey-500">{b.customer_email}</span>
                  </Link>
                </td>
                <td className="t-body4 px-4 py-3 text-grey-300">{b.yachts?.name ?? "—"}</td>
                <td className="t-body4 px-4 py-3 text-grey-300">
                  {b.start_date} → {b.end_date}
                </td>
                <td className="t-body4 px-4 py-3 text-white">{formatEUR(b.deposit)}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="t-body3 px-4 py-10 text-center text-grey-500">
                  No reservations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
