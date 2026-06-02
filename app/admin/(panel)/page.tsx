import { getDashboardStats } from "@/lib/admin/queries";
import { formatEUR } from "@/lib/money";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Pending payment", value: String(stats.pending) },
    { label: "Confirmed", value: String(stats.confirmed) },
    { label: "Upcoming charters", value: String(stats.upcoming) },
    { label: "Deposits collected", value: formatEUR(stats.depositsCollected) },
  ];

  return (
    <div>
      <h1 className="t-h3 mb-1 text-white">Dashboard</h1>
      <p className="t-body3 mb-8 text-grey-400">Overview of your reservations.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-white/10 bg-white/5 p-5">
            <p className="eyebrow mb-3">{c.label}</p>
            <p className="t-h3 text-white">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
