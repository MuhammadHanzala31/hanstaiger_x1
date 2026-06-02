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
import type {
  DraftState,
  ServiceWithOptions,
  Yacht,
  WizardStep,
  BlockedRange,
} from "@/lib/booking/types";
import type { SelectedOption } from "@/lib/types";

const STEP_META: Record<WizardStep, { eyebrow: string; title: string; description: string; info: string }> = {
  dates: {
    eyebrow: "Select your dates",
    title: "Select your dates",
    description: "Confirm your departure and return dates to see your total.",
    info: "We'll hold these dates while you complete your booking. Blocked days are unavailable.",
  },
  guests: {
    eyebrow: "Choose your guests",
    title: "Choose your guests",
    description: "Share who will join your experience. Extra guests add to the total.",
    info: "Includes the base group; each guest beyond that adds an extra cost, up to the maximum.",
  },
  services: {
    eyebrow: "Enhance your experience",
    title: "Enhance your experience",
    description: "Add tailored services for your destination and experience.",
    info: "You can skip this step and customize later with your concierge.",
  },
  details: {
    eyebrow: "Lock in your reservation",
    title: "Lock in your reservation",
    description: "Enter your details and secure your charter with a deposit.",
    info: "In the next step you'll pay a deposit to secure your reservation.",
  },
};

const ORDER: WizardStep[] = ["dates", "guests", "services", "details"];

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

  const meta = STEP_META[step];
  const next = () => {
    const i = ORDER.indexOf(step);
    if (i < ORDER.length - 1) setStep(ORDER[i + 1]);
  };
  const back = () => {
    const i = ORDER.indexOf(step);
    if (i > 0) setStep(ORDER[i - 1]);
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

  const heroStyle = yacht.heroImage
    ? { backgroundImage: `url(${yacht.heroImage})` }
    : undefined;

  return (
    <div
      className="relative flex min-h-screen flex-col bg-grey-900 bg-cover bg-center"
      style={heroStyle}
    >
      {/* atmospheric overlay over the hero photo */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-grey-900/70 via-grey-900/40 to-grey-900/90" />
      {!yacht.heroImage && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_-10%,#2b3b52_0%,#111213_60%)]" />
      )}

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* top bar */}
        <header className="flex items-center justify-between px-8 py-6 md:px-20">
          <span className="t-caption1 uppercase tracking-[0.3em] text-white">Hanstaiger</span>
          <Link
            href="/"
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
          >
            ✕
          </Link>
        </header>

        {phase === "intro" ? (
          <IntroCarousel onStart={() => setPhase("wizard")} />
        ) : (
          <WizardChrome
            yacht={yacht}
            draft={draft}
            step={step}
            onStep={setStep}
            eyebrow={meta.eyebrow}
            title={meta.title}
            description={meta.description}
            info={meta.info}
          >
            {step === "dates" && (
              <div className="flex flex-col gap-4">
                <Calendar
                  value={{ start: draft.startDate, end: draft.endDate }}
                  blocked={blocked}
                  seasonStart={yacht.seasonStart}
                  seasonEnd={yacht.seasonEnd}
                  onSelect={handleDates}
                />
                <StepNav
                  onNext={next}
                  nextDisabled={!draft.startDate || !draft.endDate}
                />
              </div>
            )}

            {step === "guests" && (
              <div className="flex flex-col gap-4">
                <GuestStepper
                  value={draft.guests}
                  min={yacht.includedGuests}
                  max={yacht.maxGuests}
                  onChange={handleGuests}
                />
                <StepNav onBack={back} onNext={next} />
              </div>
            )}

            {step === "services" && (
              <div className="flex flex-col gap-4">
                <ServicePicker
                  services={services}
                  selected={draft.selectedOptions}
                  onChange={handleServices}
                />
                <StepNav onBack={back} onNext={next} nextLabel="Continue" />
              </div>
            )}

            {step === "details" && (
              <div className="flex flex-col gap-4">
                <DetailsForm deposit={draft.deposit} onProceed={handleProceed} />
                <StepNav onBack={back} />
              </div>
            )}
          </WizardChrome>
        )}
      </div>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Next",
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="t-button2 rounded-sm border border-white/20 px-4 py-2 text-grey-200 transition-colors hover:bg-white/10"
        >
          Back
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="t-button1 rounded-sm bg-white px-6 py-2 text-grey-900 transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
