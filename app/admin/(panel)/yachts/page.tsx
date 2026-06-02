import Link from "next/link";
import { listYachts } from "@/lib/admin/queries";
import { formatEUR } from "@/lib/money";
import { toggleYachtActive } from "./actions";

export default async function YachtsPage() {
  const yachts = await listYachts();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="t-h3 text-white">Yachts</h1>
        <Link
          href="/admin/yachts/new"
          className="t-button1 rounded-sm bg-orange-400 px-5 py-2 text-white hover:bg-orange-500"
        >
          New yacht
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/5 t-caption1 uppercase text-grey-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Base price</th>
              <th className="px-4 py-3">Guests</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {yachts.map((y) => {
              const toggle = toggleYachtActive.bind(null, y.id, y.is_active);
              return (
                <tr key={y.id} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/yachts/${y.id}`} className="t-body3 text-white hover:text-orange-400">
                      {y.name}
                    </Link>
                    <span className="t-caption3 block text-grey-500">/{y.slug}</span>
                  </td>
                  <td className="t-body4 px-4 py-3 text-grey-300">{formatEUR(y.base_price)}</td>
                  <td className="t-body4 px-4 py-3 text-grey-300">
                    {y.included_guests}–{y.max_guests}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggle}>
                      <button className={`t-caption3 ${y.is_active ? "text-orange-400" : "text-grey-500"}`}>
                        {y.is_active ? "Active" : "Hidden"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/yachts/${y.id}`} className="t-caption3 text-grey-400 hover:text-white">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
