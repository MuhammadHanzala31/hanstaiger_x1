import Link from "next/link";
import { headers } from "next/headers";
import { listBookings } from "@/lib/admin/queries";
import { formatEUR } from "@/lib/money";
import { StatusBadge } from "@/components/admin/StatusBadge";

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

export default async function ReservationsPage() {
  const bookings = await listBookings();
  const feed = await feedUrl();

  return (
    <div>
      <h1 className="t-h3 mb-1 text-white">Reservations</h1>
      <p className="t-body3 mb-6 text-grey-400">{bookings.length} total.</p>

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
