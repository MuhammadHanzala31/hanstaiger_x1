"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { formatEUR } from "@/lib/money";
import type { DraftState, Yacht, WizardStep } from "@/lib/booking/types";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "dates", label: "Dates" },
  { key: "guests", label: "Guests" },
  { key: "services", label: "Services" },
  { key: "details", label: "Confirm" },
];

function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00")
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

function stepValue(step: WizardStep, draft: DraftState): string {
  switch (step) {
    case "dates":
      return draft.startDate && draft.endDate
        ? `${shortDate(draft.startDate)} - ${shortDate(draft.endDate)}`
        : "—";
    case "guests":
      return draft.startDate ? String(draft.guests) : "—";
    case "services":
      return draft.selectedOptions.length ? String(draft.selectedOptions.length) : "—";
    case "details":
      return "—";
  }
}

export function WizardChrome({
  yacht,
  draft,
  step,
  onStep,
  title,
  subtitle,
  info,
  children,
}: {
  yacht: Yacht;
  draft: DraftState;
  step: WizardStep;
  onStep: (s: WizardStep) => void;
  title: string;
  subtitle: string;
  info: string;
  children: ReactNode;
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-between px-8 pb-[45px] pt-[30px] md:px-20">
      {/* Header: vertical step nav · centered wordmark · close */}
      <header className="relative flex w-full items-start justify-between">
        <nav className="flex flex-col gap-4 pt-2">
          {STEPS.map((s) => {
            const active = s.key === step;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onStep(s.key)}
                className="flex items-center gap-4 text-left"
              >
                <span
                  className={`h-[2px] w-[2px] rounded-[0.3px] ${active ? "bg-white" : "opacity-0"}`}
                />
                <span
                  className={`t-caption3 w-[50px] uppercase ${active ? "text-white" : "text-grey-200"}`}
                >
                  {s.label}
                </span>
                <span
                  className={`t-caption3 whitespace-nowrap uppercase ${active ? "text-white" : "text-grey-200"}`}
                >
                  {stepValue(s.key, draft)}
                </span>
              </button>
            );
          })}
        </nav>

        <span className="t-caption1 absolute left-1/2 top-1 -translate-x-1/2 uppercase tracking-[0.4em] text-white">
          Hanstaiger
        </span>

        <Link
          href="/"
          aria-label="Close"
          className="frost flex size-9 items-center justify-center rounded-[2px] text-white transition-colors hover:bg-white/15"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </Link>
      </header>

      {/* Centered heading */}
      <div className="flex flex-col items-center gap-8 pb-[68px] text-center">
        <h1 className="t-h1 text-white">{title}</h1>
        <p className="t-caption1 uppercase text-white">{subtitle}</p>
      </div>

      {/* Step-specific control (centered bottom) */}
      <div className="relative flex flex-col items-center">{children}</div>

      {/* Total — bottom-left frosted card with logo thumbnail */}
      <div className="frost absolute bottom-[38px] left-8 flex w-[92px] flex-col gap-4 rounded-[4px] p-[6px] md:left-20">
        <div className="flex aspect-square w-full items-center justify-center rounded-[3.667px] bg-white">
          <SailMark />
        </div>
        <div className="flex flex-col gap-2">
          <p className="t-caption3 uppercase text-white">Total amount</p>
          <p className="t-body2 text-white">{formatEUR(draft.total)}</p>
        </div>
      </div>

      {/* Info — bottom-right frosted card */}
      <button
        type="button"
        onClick={() => setInfoOpen((o) => !o)}
        className="frost absolute bottom-[38px] right-8 flex max-w-[160px] flex-col items-end gap-2 rounded-[4px] p-[6px] text-left md:right-20"
      >
        <div className="flex w-full items-center justify-between gap-6">
          <span className="t-caption3 uppercase text-white">Info</span>
          <span className="t-caption3 text-white">{infoOpen ? "–" : "+"}</span>
        </div>
        {infoOpen && <p className="t-caption3 uppercase text-white">{info}</p>}
      </button>

      <span className="sr-only">
        {yacht.name} · up to {yacht.maxGuests} guests
      </span>
    </div>
  );
}

function SailMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 3 5 17h6V3Z M13 7l5 10h-5 M3 20h18"
        stroke="#111213"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
