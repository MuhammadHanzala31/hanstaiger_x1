import Link from "next/link";
import { listYachts } from "@/lib/admin/queries";
import { createServiceClient } from "@/lib/supabase/service";
import { addBlock, removeBlock } from "./actions";

const REASON_LABEL: Record<string, string> = {
  booked: "Booked",
  maintenance: "Maintenance",
  hold: "Hold",
};

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ yacht?: string }>;
}) {
  const yachts = await listYachts();
  const { yacht: selectedId } = await searchParams;
  const yacht = yachts.find((y) => y.id === selectedId) ?? yachts[0];

  const client = createServiceClient();
  const { data: blocks } = yacht
    ? await client
        .from("availability_blocks")
        .select("*")
        .eq("yacht_id", yacht.id)
        .order("start_date")
    : { data: [] };

  return (
    <div className="max-w-3xl">
      <h1 className="t-h3 mb-1 text-white">Availability</h1>
      <p className="t-body3 mb-6 text-grey-400">
        Block days so they can&apos;t be booked. Confirmed bookings appear here as
        &ldquo;Booked&rdquo; and free up automatically when cancelled.
      </p>

      <div className="mb-8 flex gap-2">
        {yachts.map((y) => (
          <Link
            key={y.id}
            href={`/admin/availability?yacht=${y.id}`}
            className={`t-button2 rounded-sm px-3 py-2 ${
              y.id === yacht?.id ? "bg-white text-grey-900" : "border border-white/20 text-grey-300"
            }`}
          >
            {y.name}
          </Link>
        ))}
      </div>

      {yacht && (
        <>
          <form
            action={addBlock}
            className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-white/10 bg-white/5 p-5"
          >
            <input type="hidden" name="yacht_id" value={yacht.id} />
            <Labeled label="From">
              <input type="date" name="start_date" required className="admin-input" />
            </Labeled>
            <Labeled label="To (exclusive)">
              <input type="date" name="end_date" required className="admin-input" />
            </Labeled>
            <Labeled label="Reason">
              <select name="reason" className="admin-input">
                <option value="hold">Hold</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </Labeled>
            <Labeled label="Note">
              <input type="text" name="note" className="admin-input" placeholder="optional" />
            </Labeled>
            <button
              type="submit"
              className="t-button1 rounded-sm bg-orange-400 px-5 py-2 text-white hover:bg-orange-500"
            >
              Block
            </button>
          </form>

          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 t-caption1 uppercase text-grey-400">
                <tr>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(blocks ?? []).map((b) => {
                  const remove = removeBlock.bind(null, b.id);
                  return (
                    <tr key={b.id} className="border-t border-white/5">
                      <td className="t-body4 px-4 py-3 text-grey-300">{b.start_date}</td>
                      <td className="t-body4 px-4 py-3 text-grey-300">{b.end_date}</td>
                      <td className="t-body4 px-4 py-3 text-grey-300">
                        {REASON_LABEL[b.reason] ?? b.reason}
                      </td>
                      <td className="t-body4 px-4 py-3 text-grey-500">{b.note ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <form action={remove}>
                          <button className="t-caption3 text-grey-500 hover:text-obsession-red">
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {(blocks ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="t-body3 px-4 py-8 text-center text-grey-500">
                      No blocks. All in-season dates are available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="t-caption3 text-grey-400">{label}</span>
      {children}
    </label>
  );
}
