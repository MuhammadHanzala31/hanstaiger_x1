"use client";

import { useMemo, useState, useTransition } from "react";
import { Calendar, iso, monthOf } from "@/components/booking/Calendar";
import { CheckoutCta, PanelHeader, Sheet, StepButtons, type CtaProps } from "@/components/booking/ui";
import { shortDate } from "@/lib/booking/stepValue";
import type { BlockedRange, DraftState } from "@/lib/booking/types";

const DAY_MS = 86_400_000;

export function DatesPanel({
  draft,
  blocked,
  seasonStart,
  seasonEnd,
  onSelect,
  onClear,
  onContinue,
  cta,
}: {
  draft: DraftState;
  blocked: BlockedRange[];
  seasonStart: string | null;
  seasonEnd: string | null;
  onSelect: (start: string, end: string) => Promise<{ ok: boolean; reason?: string }>;
  onClear: () => void;
  onContinue: () => void;
  cta: CtaProps;
}) {
  const today = iso(new Date());
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(draft.startDate);
  const [end, setEnd] = useState(draft.endDate);
  const [month, setMonth] = useState(() =>
    monthOf(draft.startDate ?? (seasonStart && seasonStart > today ? seasonStart : today)),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isDisabled = useMemo(() => {
    const ranges = blocked.map((b) => [Date.parse(b.start), Date.parse(b.end)]);
    return (day: string) => {
      if (day < today || (seasonStart && day < seasonStart) || (seasonEnd && day > seasonEnd)) return true;
      const t = Date.parse(day);
      return ranges.some(([s, e]) => t >= s && t < e);
    };
  }, [blocked, seasonStart, seasonEnd, today]);

  const pick = (day: string) => {
    setError(null);
    if (!start || end || day <= start) {
      setStart(day);
      setEnd(null);
      return;
    }
    for (let t = Date.parse(start); t < Date.parse(day); t += DAY_MS) {
      if (isDisabled(iso(new Date(t)))) {
        setError("Those dates include unavailable days. Pick another range.");
        setStart(day);
        return;
      }
    }
    setEnd(day);
    const from = start;
    startTransition(async () => {
      const res = await onSelect(from, day);
      if (res.ok) setOpen(false);
      else setError(reasonText(res.reason));
    });
  };

  const clear = () => {
    setStart(null);
    setEnd(null);
    setError(null);
    onClear();
  };

  const picking = open && (!start || Boolean(end)) ? "departure" : open ? "return" : null;
  const calendar = (months: 1 | 2) => (
    <Calendar month={month} months={months} onMonth={setMonth} start={start} end={end} isDisabled={isDisabled} onPick={pick} />
  );
  const errorLine = error && <p className="t-caption3 mt-3 text-obsession-red">{error}</p>;

  return (
    <>
      <PanelHeader step={1} title="Select your dates" onClear={clear} />
      <div className="mt-8 grid grid-cols-2 gap-2">
        <DateField label="Departure" value={start} active={picking === "departure"} onClick={() => setOpen(true)} />
        <DateField label="Return" value={end} active={picking === "return"} onClick={() => setOpen(true)} />
      </div>
      {open && (
        <div data-inline-calendar className="mt-4 hidden pb-2.5 desk:block">
          {calendar(2)}
        </div>
      )}
      {errorLine}
      <StepButtons canContinue={Boolean(draft.startDate && draft.endDate)} onContinue={onContinue} />

      {open && (
        <Sheet
          onClose={() => setOpen(false)}
          bar={
            <div className="flex w-full items-center justify-between">
              <span>{start ? shortDate(start) : "Select date"}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="overflow-visible text-grey-600">
                <path d="M8 0L12 4L8 8M12 4H0" />
              </svg>
              <span>{end ? shortDate(end) : "Select date"}</span>
            </div>
          }
        >
          <div className="mt-[71px]">
            <PanelHeader step={1} title="Select your dates" onClear={clear} />
          </div>
          <div className="mt-[62px]">{calendar(1)}</div>
          {errorLine}
          <CheckoutCta className="mt-[37px]" dark {...cta} />
        </Sheet>
      )}
    </>
  );
}

function DateField({ label, value, active, onClick }: { label: string; value: string | null; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <span className={`t-caption3 block uppercase ${active ? "text-grey-500" : "text-grey-600"}`}>{label}</span>
      <span className={`t-body4 mt-1 flex h-10 items-center rounded-[2px] bg-[#151515]/4 pl-4 ${value || active ? "text-grey-700" : "text-grey-500"}`}>
        {value ? shortDate(value) : "Select date"}
      </span>
    </button>
  );
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
