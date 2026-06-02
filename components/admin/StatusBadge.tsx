const STYLES: Record<string, string> = {
  confirmed: "bg-orange-400/15 text-orange-400",
  pending_payment: "bg-white/10 text-grey-300",
  cancelled: "bg-obsession-red/15 text-obsession-red",
  expired: "bg-white/5 text-grey-500",
};

const LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  pending_payment: "Pending",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`t-caption3 inline-block rounded-full px-2 py-1 ${STYLES[status] ?? "bg-white/10 text-grey-300"}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
