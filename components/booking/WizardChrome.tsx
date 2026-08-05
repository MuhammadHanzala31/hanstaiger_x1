"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { formatEUR } from "@/lib/money";
import sail from '@/public/sail.png'
import type { DraftState, Yacht, WizardStep } from "@/lib/booking/types";
import Image from "next/image";

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

function Wordmark() {
  return (
    <span className="t-caption1 absolute left-4 top-9 uppercase tracking-[0.4em] text-white md:left-1/2 md:top-8 md:-translate-x-1/2">
      Hanstaiger
    </span>
  );
}

function CloseButton() {
  return (
    <Link
      href="https://jygr5f-6j.myshopify.com/"
      aria-label="Close"
      className="frost absolute right-4 top-8 flex size-9 items-center justify-center rounded-[2px] text-white transition-colors hover:bg-white/15 md:right-20"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </Link>
  );
}

function SailMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 3 5 17h6V3Z M13 7l5 10h-5 M3 20h18"
        stroke="#111213"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
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

  const nav = (
    <nav className="flex flex-col gap-4 self-start pt-2">
      {STEPS.map((s) => {
        const active = s.key === step;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onStep(s.key)}
            className="flex items-center gap-4 text-left"
          >
            <span className={`h-[2px] w-[2px] rounded-[0.3px] ${active ? "bg-white" : "opacity-0"}`} />
            <span className={`t-caption3 w-[50px] uppercase ${active ? "text-white" : "text-grey-200"}`}>
              {s.label}
            </span>
            <span className={`t-caption3 whitespace-nowrap uppercase ${active ? "text-white" : "text-grey-200"}`}>
              {stepValue(s.key, draft)}
            </span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="relative flex min-h-screen flex-1 flex-col px-4 pb-0 pt-[80px] md:items-center md:justify-between md:px-20 md:pb-[45px] md:pt-[30px]">
      <Wordmark />
      <CloseButton />

      {/* On desktop the nav sits at top of the spaced column. */}
      <div className="hidden w-full md:block">{nav}</div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 md:flex-none md:items-center md:gap-0">
        {/* Mobile-only nav (in flow) */}
        <div className="md:hidden">{nav}</div>

        {/* Heading: left H3 on mobile, centered H1 on desktop */}
          <div className={`flex flex-col   ${title === 'Enhance your experience' ? "md:pl-10 pt-5 md:text-start text-center md:w-screen w-full md:gap-2 " : "text-left items-start gap-2 text-left md:items-center md:gap-2 md:pb-[68px]"}`}>
          <h1 className={`${title === "Enhance your experience" ? " md:w-[400px] w-full font-normal text-[20px] leading-[44px] text-white md:text-[62px] md:leading-[64px]" : "font-normal text-[40px] leading-[44px] text-white md:text-[56px] md:leading-[64px]"}`}>
            {title}
          </h1>
          <p className={`${title === 'Enhance your experience' ? 'md:text-lg text-[11px] max-w-[400px] uppercase text-white md:max-w-[400px]' : ''}`}>{subtitle}</p>
        </div>

        {/* Control */}
        <div className="relative flex w-full flex-col items-stretch md:w-auto md:items-center">
          {children}
          {/* Mobile inline info caption */}
          <p className="t-caption3 mt-2 text-center uppercase text-white md:hidden">{info}</p>
        </div>
      </div>

      {/* Total — desktop card (bottom-left) */}
      <div className="frost absolute bottom-[38px] left-20 hidden w-[92px] flex-col gap-4 rounded-[4px] p-[6px] md:flex">
        <div className="flex aspect-square w-full items-center justify-center rounded-[3.667px] bg-white">
          <Image src={sail} alt="sorry"/>
        </div>
        <div className="flex flex-col gap-2">
          <p className="t-caption3 uppercase text-white">Total amount</p>
          <p className="t-body2 text-white">{formatEUR(draft.total)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setInfoOpen((o) => !o)}
        className="frost absolute bottom-[38px] right-20 hidden max-w-[160px] flex-col items-end gap-2 rounded-[4px] p-[6px] text-left md:flex"
      >
        <div className="flex w-full items-center justify-between gap-6">
          <span className="t-caption3 uppercase text-white">Info</span>
          <span className="t-caption3 text-white">{infoOpen ? "–" : "+"}</span>
        </div>
        {infoOpen && <p className="t-caption3 uppercase text-white">{info}</p>}
      </button>

      {/* Total — mobile full-width frosted bottom bar */}
      <div className="frost -mx-4 mt-10 flex items-center gap-4 p-4 md:hidden">
        <div className="flex size-12 items-center justify-center rounded-[3.667px] bg-white">
                    <Image src={sail} alt="sorry"/>

        </div>
        <div className="flex flex-1 items-center justify-between">
          <p className="t-caption3 uppercase text-white">Total amount</p>
          <p className="t-body1 text-white">{formatEUR(draft.total)}</p>
        </div>
      </div>

      <span className="sr-only">
        {yacht.name} · up to {yacht.maxGuests} guests
      </span>
    </div>
  );
}
