"use client";

import { useMemo, useState, useTransition } from "react";
import type { BlockedRange } from "@/lib/booking/types";

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function parse(s: string): Date {
  return new Date(s + "T00:00:00Z");
}
function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

export function Calendar({
  value,
  blocked,
  seasonStart,
  seasonEnd,
  onSelect,
  onClose,
  onPendingChange,
  onError,
}: {
  value: { start: string | null; end: string | null };
  blocked: BlockedRange[];
  seasonStart: string | null;
  seasonEnd: string | null;
  onSelect: (start: string, end: string) => Promise<{ ok: boolean; reason?: string }>;
  onClose?: () => void;
  onPendingChange?: (pending: boolean) => void;
  onError?: (message: string) => void;
}) {
  const today = iso(new Date());
  const firstSelectable =
    seasonStart && seasonStart > today ? seasonStart : today;
  const initialMonth = value.start ? parse(value.start) : parse(firstSelectable);
  const [month, setMonth] = useState(
    new Date(Date.UTC(initialMonth.getUTCFullYear(), initialMonth.getUTCMonth(), 1)),
  );
  const [pendingStart, setPendingStart] = useState<string | null>(value.start);
  const [pendingEnd, setPendingEnd] = useState<string | null>(value.end);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dayBlocked = useMemo(() => {
    return (day: string) => {
      const t = parse(day).getTime();
      if (day < today) return true;
      if (seasonStart && day < seasonStart) return true;
      if (seasonEnd && day > seasonEnd) return true;
      for (const b of blocked) {
        if (t >= parse(b.start).getTime() && t < parse(b.end).getTime()) return true;
      }
      return false;
    };
  }, [blocked, seasonStart, seasonEnd, today]);

  const rangeHasBlocked = (start: string, end: string) => {
    for (let t = parse(start).getTime(); t < parse(end).getTime(); t += DAY_MS) {
      if (dayBlocked(iso(new Date(t)))) return true;
    }
    return false;
  };

  const pick = (day: string) => {
    setError(null);
    if (!pendingStart || (pendingStart && pendingEnd)) {
      setPendingStart(day);
      setPendingEnd(null);
      return;
    }
    if (day <= pendingStart) {
      setPendingStart(day);
      return;
    }
    if (rangeHasBlocked(pendingStart, day)) {
      setError("Those dates include unavailable days. Pick another range.");
      setPendingStart(day);
      setPendingEnd(null);
      return;
    }
    setPendingEnd(day);
    const start = pendingStart;

    // Close immediately — don't make the user wait for the server round trip.
    onClose?.();
    onPendingChange?.(true);

    startTransition(async () => {
      const res = await onSelect(start, day);
      onPendingChange?.(false);
      if (!res.ok) {
        onError?.(reasonText(res.reason));
      }
    });
  };

  const inRange = (day: string) =>
    pendingStart && pendingEnd && day > pendingStart && day < pendingEnd;

  const cells = buildMonthCells(month);

  return (
    <div className="bg-black/95 w-full border-b border-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className="px-2 text-grey-300 hover:text-white">‹</button>
        <span className="t-body3 text-white">
          {month.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}
        </span>
        <button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))} className="px-2 text-grey-300 hover:text-white">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="t-caption3 py-1 text-center text-grey-500">{w}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const day = iso(cell);
          const disabled = dayBlocked(day);
          const isStart = day === pendingStart;
          const isEnd = day === pendingEnd;
          const selected = isStart || isEnd;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => pick(day)}
              aria-label={day}
              className={[
                "t-body4 h-9 rounded-sm transition-colors",
                disabled ? "cursor-not-allowed text-grey-700 line-through" : "text-grey-200 hover:bg-white/10",
                inRange(day) ? "bg-[#441C04] text-white" : "",
                selected ? "!bg-[#742F06] !text-white" : "",
              ].join(" ")}
            >
              {cell.getUTCDate()}
            </button>
          );
        })}
      </div>

      {error && <p className="t-caption3 mt-3 text-obsession-red">{error}</p>}
    </div>
  );
}

function buildMonthCells(month: Date): (Date | null)[] {
  const year = month.getUTCFullYear();
  const m = month.getUTCMonth();
  const first = new Date(Date.UTC(year, m, 1));
  const startPad = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, m, d)));
  return cells;
}

function reasonText(reason?: string): string {
  switch (reason) {
    case "min_nights":
      return "Your stay is too short for this yacht.";
    case "max_nights":
      return "Your stay exceeds the maximum charter length.";
    case "out_of_season":
      return "Those dates are outside the available season.";
    case "unavailable":
      return "Those dates are no longer available.";
    case "invalid_range":
      return "Please choose a valid date range.";
    default:
      return "Those dates can't be booked. Try another range.";
  }
}