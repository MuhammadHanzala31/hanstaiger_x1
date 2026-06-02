"use client";

import { useState, type ReactNode } from "react";
import { formatEUR } from "@/lib/money";
import type { DraftState, Yacht, WizardStep } from "@/lib/booking/types";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "dates", label: "Dates" },
  { key: "guests", label: "Guests" },
  { key: "services", label: "Services" },
  { key: "details", label: "Confirm" },
];

function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function stepValue(step: WizardStep, draft: DraftState): string {
  switch (step) {
    case "dates":
      return draft.startDate && draft.endDate
        ? `${shortDate(draft.startDate)} – ${shortDate(draft.endDate)}`
        : "—";
    case "guests":
      return draft.guests ? String(draft.guests) : "—";
    case "services":
      return draft.selectedOptions.length
        ? `${draft.selectedOptions.length} selected`
        : "—";
    case "details":
      return "—";
  }
}

export function WizardChrome({
  yacht,
  draft,
  step,
  onStep,
  eyebrow,
  title,
  description,
  info,
  children,
}: {
  yacht: Yacht;
  draft: DraftState;
  step: WizardStep;
  onStep: (s: WizardStep) => void;
  eyebrow: string;
  title: string;
  description: string;
  info: string;
  children: ReactNode;
}) {
  const [infoOpen, setInfoOpen] = useState(true);

  return (
    <div className="flex flex-1 flex-col px-8 pb-10 md:px-20 md:pb-14">
      {/* Step navigation */}
      <nav className="flex flex-wrap gap-x-10 gap-y-3 border-b border-white/10 pb-6">
        {STEPS.map((s) => {
          const active = s.key === step;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onStep(s.key)}
              className="flex flex-col items-start text-left"
            >
              <span
                className={`eyebrow ${active ? "!text-white" : ""}`}
              >
                {s.label}
              </span>
              <span
                className={`t-body4 mt-1 ${active ? "text-white" : "text-grey-500"}`}
              >
                {stepValue(s.key, draft)}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Heading */}
      <div className="flex flex-1 flex-col justify-center py-12">
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="t-title3 max-w-2xl text-white">{title}</h1>
        <p className="t-body2 mt-4 max-w-md text-grey-300">{description}</p>
      </div>

      {/* Footer: total · control · info */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-end gap-4">
          <LogoMark />
          <div>
            <p className="eyebrow mb-1">Total amount</p>
            <p className="t-h3 text-white">{formatEUR(draft.total)}</p>
          </div>
        </div>

        <div className="flex-1 lg:max-w-xl lg:px-10">{children}</div>

        <div className="lg:w-72">
          <div className="frost rounded-md border border-white/10 p-4">
            <button
              type="button"
              onClick={() => setInfoOpen((o) => !o)}
              className="flex w-full items-center justify-between"
            >
              <span className="eyebrow">Info</span>
              <span className="t-body2 text-grey-400">{infoOpen ? "–" : "+"}</span>
            </button>
            {infoOpen && (
              <p className="t-body4 mt-3 text-grey-400">{info}</p>
            )}
          </div>
          <p className="t-caption3 mt-3 text-grey-500">
            {yacht.name} · up to {yacht.maxGuests} guests
          </p>
        </div>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M8 1 3 11h10L8 1Z M8 11v4 M4 15h8"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        />
      </svg>
    </div>
  );
}
