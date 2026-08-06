import Link from "next/link";
import type { CalendarEvent, CalendarEventKind } from "@/lib/admin/queries";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const KIND_STYLE: Record<CalendarEventKind, string> = {
  confirmed: "bg-orange-400/20 text-orange-300 border-l-2 border-orange-400",
  pending: "bg-white/10 text-grey-300 border-l-2 border-dashed border-grey-400",
  hold: "bg-grey-700/70 text-grey-200 border-l-2 border-grey-400",
  maintenance: "bg-obsession-red/15 text-obsession-red border-l-2 border-obsession-red",
};

const LEGEND: { kind: CalendarEventKind; label: string; swatch: string }[] = [
  { kind: "confirmed", label: "Confirmed", swatch: "bg-orange-400" },
  { kind: "pending", label: "Pending", swatch: "bg-grey-400" },
  { kind: "hold", label: "Hold", swatch: "bg-grey-700" },
  { kind: "maintenance", label: "Maintenance", swatch: "bg-obsession-red" },
];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildMonthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const startPad = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, month, d)));
  return cells;
}

export function BookingsCalendar({
  year,
  month,
  events,
  prevHref,
  nextHref,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  prevHref: string;
  nextHref: string;
}) {
  const cells = buildMonthCells(year, month);
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const eventsForDay = (day: string) =>
    events.filter((e) => day >= e.start_date && day < e.end_date);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <Link href={prevHref} aria-label="Previous month" className="t-body3 px-2 text-grey-300 hover:text-white">
          ‹
        </Link>
        <span className="t-body1 text-white">{monthLabel}</span>
        <Link href={nextHref} aria-label="Next month" className="t-body3 px-2 text-grey-300 hover:text-white">
          ›
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap gap-4">
        {LEGEND.map((l) => (
          <span key={l.kind} className="t-caption3 flex items-center gap-1.5 text-grey-400">
            <span className={`h-2 w-2 rounded-full ${l.swatch}`} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-sm bg-white/10">
        {WEEKDAYS.map((w) => (
          <div key={w} className="t-caption3 bg-grey-900 py-2 text-center text-grey-500">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="min-h-[110px] bg-grey-900/60" />;
          const day = iso(cell);
          const dayEvents = eventsForDay(day);
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;
          return (
            <div key={i} className="min-h-[110px] bg-grey-900 p-1.5">
              <span className="t-caption3 text-grey-500">{cell.getUTCDate()}</span>
              <div className="mt-1 flex flex-col gap-1">
                {visible.map((e) => {
                  const chip = (
                    <span
                      title={e.label}
                      className={`t-caption3 block truncate rounded-xs px-1 py-0.5 ${KIND_STYLE[e.kind]}`}
                    >
                      {e.label}
                    </span>
                  );
                  return e.href ? (
                    <Link key={e.id} href={e.href}>
                      {chip}
                    </Link>
                  ) : (
                    <div key={e.id}>{chip}</div>
                  );
                })}
                {overflow > 0 && (
                  <span className="t-caption3 text-grey-500">+{overflow} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
