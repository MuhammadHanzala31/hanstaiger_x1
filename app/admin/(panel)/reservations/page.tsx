import Link from "next/link";
import { listBookings } from "@/lib/admin/queries";
import { formatEUR } from "@/lib/money";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function ReservationsPage() {
  const bookings = await listBookings();

  return (
    <div>
      <h1 className="t-h3 mb-1 text-white">Reservations</h1>
      <p className="t-body3 mb-8 text-grey-400">{bookings.length} total.</p>

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
