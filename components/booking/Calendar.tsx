const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function monthOf(day: string): Date {
  return new Date(day.slice(0, 8) + "01T00:00:00Z");
}
function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

/** Month grid(s): two side by side on desktop, one inside the mobile sheet. */
export function Calendar({
  month,
  months,
  onMonth,
  start,
  end,
  isDisabled,
  onPick,
}: {
  month: Date;
  months: 1 | 2;
  onMonth: (m: Date) => void;
  start: string | null;
  end: string | null;
  isDisabled: (day: string) => boolean;
  onPick: (day: string) => void;
}) {
  const shown = months === 2 ? [month, addMonths(month, 1)] : [month];
  return (
    <div className={`grid gap-4 ${months === 2 ? "grid-cols-2" : ""}`}>
      {shown.map((m, i) => (
        <div key={iso(m)}>
          <div className="relative h-[18px] text-center">
            {i === 0 && (
              <button type="button" aria-label="Previous month" onClick={() => onMonth(addMonths(month, -1))} className="absolute -left-1.5 top-0 desk:left-0">
                <Chevron d="M10.332 12L6.332 8L10.332 4" />
              </button>
            )}
            <p className="text-[12px]/[18px] font-bold tracking-[0.2px] text-grey-850">
              {m.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}
            </p>
            {i === shown.length - 1 && (
              <button type="button" aria-label="Next month" onClick={() => onMonth(addMonths(month, 1))} className="absolute -right-[5.32px] top-0 desk:right-0">
                <Chevron d="M6.34 4L10.34 8L6.34 12" />
              </button>
            )}
          </div>
          <div className="mt-[23px] grid grid-cols-7 text-center text-[12px]/[16px] font-medium tracking-[0.2px] text-grey-500 desk:mt-[19px]">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 desk:mt-[3px]">
            {monthCells(m).map((d, k) => {
              if (!d) return <span key={k} />;
              const day = iso(d);
              const disabled = isDisabled(day);
              const edge = day === start || day === end;
              const inRange = start && end && day > start && day < end;
              return (
                <button
                  key={k}
                  type="button"
                  aria-label={day}
                  aria-pressed={edge}
                  disabled={disabled}
                  onClick={() => onPick(day)}
                  className={`relative flex h-12 items-center justify-center text-[12px]/[16px] font-bold tracking-[0.2px] desk:h-[50px] ${
                    disabled ? "cursor-not-allowed text-grey-400" : edge ? "text-white" : "text-grey-900"
                  }`}
                >
                  {(edge || inRange) && <span className={`absolute size-9 rounded-[2px] ${edge ? "bg-grey-900" : "bg-grey-50"}`} />}
                  <span className="relative">{d.getUTCDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Chevron({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-grey-850">
      <path d={d} />
    </svg>
  );
}

/** Leading blanks (weeks start on Sunday) followed by each day of the month. */
function monthCells(month: Date): (Date | null)[] {
  const y = month.getUTCFullYear();
  const m = month.getUTCMonth();
  const pad = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return [
    ...Array<null>(pad).fill(null),
    ...Array.from({ length: days }, (_, i) => new Date(Date.UTC(y, m, i + 1))),
  ];
}
