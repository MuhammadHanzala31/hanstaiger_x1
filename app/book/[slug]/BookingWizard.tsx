"use client";

import { useState } from "react";
import Link from "next/link";
import { IntroCarousel } from "@/components/booking/IntroCarousel";
import { WizardChrome } from "@/components/booking/WizardChrome";
import { Calendar } from "@/components/booking/Calendar";
import { GuestStepper } from "@/components/booking/GuestStepper";
import { ServicePicker } from "@/components/booking/ServicePicker";
import { DetailsForm } from "@/components/booking/DetailsForm";
import { setDates, setGuests, setServices } from "@/lib/booking/draft-actions";
import { createCheckoutSession } from "@/lib/booking/checkout";
import { formatEUR } from "@/lib/money";
import type {
  DraftState,
  ServiceWithOptions,
  Yacht,
  WizardStep,
  BlockedRange,
} from "@/lib/booking/types";
import type { SelectedOption } from "@/lib/types";

const STEP_META: Record<WizardStep, { title: string; subtitle: string; info: string }> = {
  dates: {
    title: "Select your dates",
    subtitle: "Confirm your departure and return dates to see your total",
    info: "We will block the X1 on these dates for 30 min",
  },
  guests: {
    title: "Choose your guests",
    subtitle: "Includes the base group, with an extra cost per guest",
    info: "Each guest beyond the included group adds to your total, up to the maximum",
  },
  services: {
    title: "Enhance your experience",
    subtitle: "Add tailored services for your destination and experience",
    info: "You can skip this step and customize later with your concierge",
  },
  details: {
    title: "Lock in your reservation",
    subtitle: "Enter your details and secure your charter with a deposit",
    info: "In the next step you'll pay a deposit to secure your reservation",
  },
};

const ORDER: WizardStep[] = ["dates", "guests", "services", "details"];

function pillDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function datesErrorText(reason?: string): string {
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

export function BookingWizard({
  yacht,
  services,
  blocked,
  initialDraft,
}: {
  yacht: Yacht;
  services: ServiceWithOptions[];
  blocked: BlockedRange[];
  initialDraft: DraftState;
}) {
  const [phase, setPhase] = useState<"intro" | "wizard">("intro");
  const [step, setStep] = useState<WizardStep>("dates");
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [calOpen, setCalOpen] = useState(false);
  const [datesPending, setDatesPending] = useState(false);
  const [datesError, setDatesError] = useState<string | null>(null);

  const meta = STEP_META[step];
  const next = () => {
    const i = ORDER.indexOf(step);
    if (i < ORDER.length - 1) setStep(ORDER[i + 1]);
  };

  const handleDates = async (start: string, end: string) => {
    const res = await setDates(yacht.id, start, end);
    if (res.ok) setDraft(res.state);
    return { ok: res.ok, reason: res.ok ? undefined : res.reason };
  };
  const handleGuests = async (n: number) => setDraft(await setGuests(yacht.id, n));
  const handleServices = async (opts: SelectedOption[]) =>
    setDraft(await setServices(yacht.id, opts));

  const handleProceed = async (customer: {
    name: string;
    email: string;
    phone: string;
  }): Promise<string | void> => {
    const res = await createCheckoutSession(customer);
    if ("url" in res) {
      window.location.assign(res.url);
      return;
    }
    if (res.error === "incomplete") return "Please select your dates first.";
    if (["unavailable", "out_of_season", "min_nights", "max_nights"].includes(res.error))
      return "Those dates are no longer available — please choose again.";
    return "Something went wrong starting checkout. Please try again.";
  };

  const hasDates = Boolean(draft.startDate && draft.endDate);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-grey-900">
      {yacht.heroImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={yacht.heroImage}
          alt=""
          className={`pointer-events-none absolute inset-0 size-full object-cover ${
            phase === "wizard" ? "scale-110 blur-[14px]" : "scale-110 blur-[20px]"
          }`}
        />
      )}
      <div
        className={`pointer-events-none absolute inset-0 ${
          phase === "wizard" ? "bg-grey-900/65" : "bg-grey-900/40"
        }`}
      />
      {!yacht.heroImage && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_-10%,#2b3b52_0%,#111213_60%)]" />
      )}

      <div className="relative z-10 flex min-h-screen flex-col">
        {phase === "intro" ? (
          <>
            <header className="flex items-center justify-between px-8 py-6 md:px-20">
              <span className="t-caption1 uppercase tracking-[0.4em] text-white">Hanstaiger</span>
              <Link href="https://jygr5f-6j.myshopify.com/" aria-label="Close" className="frost flex size-9 items-center justify-center rounded-[2px] text-white hover:bg-white/15">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </Link>
            </header>
            <IntroCarousel onStart={() => setPhase("wizard")} />
          </>
        ) : (
          <WizardChrome
            yacht={yacht}
            draft={draft}
            step={step}
            onStep={setStep}
            title={meta.title}
            subtitle={meta.subtitle}
            info={meta.info}
          >
            {step === "dates" && (
              <div className="relative flex w-full flex-col justify-between h-[30vh] gap-2 md:w-auto">
                <div>
                  {calOpen && (
                  <div className="absolute bottom-9 md:left-[12vw] left-1/2 z-20 mb-3 w-[320px] max-w-[92vw] -translate-x-1/2">
                    <Calendar
                      value={{ start: draft.startDate, end: draft.endDate }}
                      blocked={blocked}
                      seasonStart={yacht.seasonStart}
                      seasonEnd={yacht.seasonEnd}
                      onSelect={async (s, e) => {
                        // Close immediately — don't make the user wait for the server round trip.
                        setCalOpen(false);
                        setDatesPending(true);
                        setDatesError(null);
                        const r = await handleDates(s, e);
                        setDatesPending(false);
                        if (!r.ok) setDatesError(datesErrorText(r.reason));
                        return r;
                      }}
                    />
                  </div>
                )}
                </div>
                <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-end">
                  <button
                    type="button"
                    onClick={() => setCalOpen((o) => !o)}
                    disabled={datesPending}
                    className="flex h-12 w-full items-center justify-between gap-9 rounded-[2px] bg-grey-900 px-4 text-white disabled:opacity-70 md:w-auto md:justify-start"
                  >
                    {datesPending ? (
                      <span className="flex w-full items-center justify-center gap-2">
                        <svg className="size-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="t-body3">Checking availability…</span>
                      </span>
                    ) : (
                      <>
                        <span className="t-body3">{draft.startDate ? pillDate(draft.startDate) : "Departure"}</span>
                        <span aria-hidden>→</span>
                        <span className="t-body3">{draft.endDate ? pillDate(draft.endDate) : "Return"}</span>
                      </>
                    )}
                  </button>
                  <SecondaryButton onClick={next} disabled={!hasDates || datesPending}>Next</SecondaryButton>
                </div>
                {datesError && (
                  <p className="t-caption3 text-obsession-red">{datesError}</p>
                )}
              </div>
            )}

            {step === "guests" && (
              <div className="flex w-full flex-col items-stretch md:justify-between h-[30vh] gap-2 md:w-auto md:flex-row md:items-end">
                <GuestStepper
                  value={draft.guests}
                  min={yacht.includedGuests}
                  max={yacht.maxGuests}
                  onChange={handleGuests}
                />
                <SecondaryButton onClick={next}>Next</SecondaryButton>
              </div>
            )}

            {step === "services" && (
              <div className="flex w-full relative md:-top-40 flex-col gap-2 md:w-[360px]">
                <ServicePicker
                  services={services}
                  selected={draft.selectedOptions}
                  onChange={handleServices}
                />
                <button
                  type="button"
                  onClick={next}
                  className="t-button1 rounded-[2px] bg-orange-400 px-6 py-3 text-white transition-colors hover:bg-orange-500"
                >
                  Proceed to checkout
                </button>
              </div>
            )}

            {step === "details" && (
              <div className="w-full flex flex-col gap-2 md:w-[360px] relative md:-top-16">
                <DetailsForm deposit={draft.deposit} onProceed={handleProceed} />
                <p className="t-caption3 mt-3 text-center uppercase text-grey-300">
                  Deposit due · {formatEUR(draft.deposit)}
                </p>
              </div>
            )}
          </WizardChrome>
        )}
      </div>
    </div>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="t-button1 flex h-12 w-full items-center justify-center rounded-[2px] border border-white px-6 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
    >
      {children}
    </button>
  );
}