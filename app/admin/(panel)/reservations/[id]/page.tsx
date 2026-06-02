import { notFound } from "next/navigation";
import Link from "next/link";
import { getBooking } from "@/lib/admin/queries";
import { formatEUR } from "@/lib/money";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { cancelBooking } from "../actions";

interface LineItem {
  label: string;
  amount: number;
}

export default async function ReservationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const lineItems = (booking.line_items ?? []) as LineItem[];
  const cancel = cancelBooking.bind(null, id);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/reservations" className="t-caption3 text-grey-500 hover:text-white">
        ← Reservations
      </Link>
      <div className="mb-6 mt-2 flex items-center justify-between">
        <h1 className="t-h3 text-white">{booking.customer_name}</h1>
        <StatusBadge status={booking.status} />
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-white/10 bg-white/5 p-5">
        <Item label="Email" value={booking.customer_email} />
        <Item label="Phone" value={booking.customer_phone ?? "—"} />
        <Item label="Yacht" value={booking.yachts?.name ?? "—"} />
        <Item label="Guests" value={String(booking.guests)} />
        <Item label="Dates" value={`${booking.start_date} → ${booking.end_date}`} />
        <Item label="Booked" value={new Date(booking.created_at).toLocaleString()} />
      </dl>

      <div className="mb-6 rounded-lg border border-white/10 p-5">
        <p className="eyebrow mb-3">Line items</p>
        {lineItems.map((l, i) => (
          <div key={i} className="flex justify-between border-b border-white/5 py-2 last:border-0">
            <span className="t-body4 text-grey-300">{l.label}</span>
            <span className="t-body4 text-white">{formatEUR(l.amount)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between">
          <span className="t-body3 text-grey-300">Total</span>
          <span className="t-body3 text-white">{formatEUR(booking.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="t-body3 text-grey-300">Deposit</span>
          <span className="t-body3 text-orange-400">{formatEUR(booking.deposit)}</span>
        </div>
      </div>

      {booking.status !== "cancelled" && (
        <form action={cancel}>
          <button
            type="submit"
            className="t-button2 rounded-sm border border-obsession-red/40 px-4 py-2 text-obsession-red transition-colors hover:bg-obsession-red/10"
          >
            Cancel reservation &amp; free dates
          </button>
        </form>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="t-caption3 text-grey-500">{label}</dt>
      <dd className="t-body3 text-white">{value}</dd>
    </div>
  );
}
