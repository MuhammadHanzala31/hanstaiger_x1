"use client";

import { useRef, useState, type ReactNode } from "react";
import { Backdrop } from "@/components/booking/Backdrop";
import { TopBar } from "@/components/booking/TopBar";
import { StepNav } from "@/components/booking/StepNav";
import { TotalCard } from "@/components/booking/TotalCard";
import { CheckoutCta, type CtaProps } from "@/components/booking/ui";
import { DatesPanel } from "@/components/booking/panels/DatesPanel";
import { GuestsPanel } from "@/components/booking/panels/GuestsPanel";
import { ServicesPanel } from "@/components/booking/panels/ServicesPanel";
import { DetailsPanel } from "@/components/booking/panels/DetailsPanel";
import { getStepIndex } from "@/lib/booking/steps";
import { setDates, setGuests, setServices } from "@/lib/booking/draft-actions";
import { createCheckoutSession } from "@/lib/booking/checkout";
import { formatTotal } from "@/lib/money";
import type {
  BlockedRange,
  DraftState,
  ServiceWithOptions,
  WizardStep,
  Yacht,
} from "@/lib/booking/types";
import type { SelectedOption } from "@/lib/types";

const UNAVAILABLE_ERRORS = ["unavailable", "out_of_season", "min_nights", "max_nights"];

// Mobile gap between the intro (title or step nav) and the step card, per the design.
const CARD_GAP: Record<WizardStep, string> = {
  dates: "mt-[42px]",
  guests: "mt-[69px]",
  services: "",
  details: "",
};

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
  const [step, setStep] = useState<WizardStep>("dates");
  const [reached, setReached] = useState(0);
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const [guestsChosen, setGuestsChosen] = useState(false);

  // Only the newest server response may overwrite the optimistic draft.
  const latest = useRef(0);
  const sync = async (request: Promise<DraftState>) => {
    const n = ++latest.current;
    const state = await request;
    if (n === latest.current) setDraft(state);
  };

  const go = (s: WizardStep) => {
    setStep(s);
    setReached((r) => Math.max(r, getStepIndex(s)));
  };
  const hasDates = Boolean(draft.startDate && draft.endDate);

  const handleDates = async (start: string, end: string) => {
    latest.current++;
    const res = await setDates(yacht.id, start, end);
    if (res.ok) setDraft(res.state);
    return { ok: res.ok, reason: res.ok ? undefined : res.reason };
  };
  const clearDates = () => {
    setDraft((d) => ({ ...d, startDate: null, endDate: null }));
    setReached(0);
  };
  const handleGuests = (n: number) => {
    setGuestsChosen(true);
    if (n === draft.guests) return;
    setDraft((d) => ({ ...d, guests: n }));
    sync(setGuests(yacht.id, n));
  };
  const clearGuests = () => {
    setGuestsChosen(false);
    setDraft((d) => ({ ...d, guests: yacht.includedGuests }));
    sync(setGuests(yacht.id, yacht.includedGuests));
  };
  const handleServices = (opts: SelectedOption[]) => {
    setDraft((d) => ({ ...d, selectedOptions: opts }));
    sync(setServices(yacht.id, opts));
  };
  const handleProceed = async (customer: { name: string; email: string; phone: string }) => {
    const res = await createCheckoutSession(customer);
    if ("url" in res) {
      window.location.assign(res.url);
      return;
    }
    if (res.error === "incomplete") return "Please select your dates first.";
    if (UNAVAILABLE_ERRORS.includes(res.error)) return "Those dates are no longer available — please choose again.";
    return "Something went wrong starting checkout. Please try again.";
  };

  const deposit =
    yacht.depositMode === "percent" ? `${yacht.depositValue}%` : formatTotal(yacht.depositValue, yacht.currency);
  const cta: CtaProps =
    step === "dates" || step === "guests"
      ? { active: false, note: "We will block the X1 on these dates for 30 min", centered: true }
      : step === "services"
        ? { active: true, onClick: () => go("details"), note: `You can skip this. In the next step, a ${deposit} deposit will secure your reservation` }
        : { active: true, form: "details-form", note: `In the next step, a ${deposit} deposit will secure your reservation` };

  const panels: Record<WizardStep, ReactNode> = {
    dates: (
      <DatesPanel
        draft={draft}
        blocked={blocked}
        seasonStart={yacht.seasonStart}
        seasonEnd={yacht.seasonEnd}
        onSelect={handleDates}
        onClear={clearDates}
        onContinue={() => go("guests")}
        cta={cta}
      />
    ),
    guests: (
      <GuestsPanel
        value={draft.guests}
        min={yacht.includedGuests}
        max={yacht.maxGuests}
        chosen={guestsChosen}
        onChange={handleGuests}
        onClear={clearGuests}
        onBack={() => setStep("dates")}
        onContinue={() => go("services")}
      />
    ),
    services: (
      <ServicesPanel
        services={services}
        selected={draft.selectedOptions}
        onChange={handleServices}
        onClear={() => handleServices([])}
        onBack={() => setStep("guests")}
        onContinue={() => go("details")}
        cta={cta}
      />
    ),
    details: <DetailsPanel onProceed={handleProceed} onBack={() => setStep("services")} />,
  };

  return (
    <div className="relative min-h-screen text-white">
      <Backdrop />
      <TopBar />
      <main className="mx-auto flex max-w-[608px] flex-col px-4 pb-24 desk:grid desk:min-h-screen desk:max-w-none desk:grid-cols-[1fr_608px] desk:grid-rows-[1fr_auto] desk:px-20 desk:pb-[30px] desk:pt-40">
        <div className="desk:col-start-1 desk:row-start-1">
          {step === "dates" ? (
            <div className="pt-[115px] desk:pt-0.5">
              <h1 className="text-[32px]/[34px] desk:text-[48px]/[54px]">
                Book the X1
                <br />
                experience
              </h1>
              <p className="t-body4 mt-[23px] desk:mt-[22px] desk:max-w-[416px]">
                Welcome to the Hanstaiger X1 booking experience. We’ll guide you through a few simple questions to craft
                your perfect voyage.
              </p>
            </div>
          ) : (
            <div className="pt-[122px] desk:pt-2">
              <StepNav active={step} reached={reached} draft={draft} guestsChosen={guestsChosen} onSelect={setStep} />
            </div>
          )}
        </div>

        {/* With the calendar open the design keeps the panel at 610px and lets the
            buttons eat into the bottom padding (16px instead of 24px). */}
        <section
          className={`flex flex-col rounded-[2px] bg-white px-4 pb-6 pt-[26px] text-grey-900 desk:col-start-2 desk:row-span-2 desk:row-start-1 desk:mt-0 desk:min-h-[610px] desk:px-8 desk:has-[[data-inline-calendar]]:pb-4 ${CARD_GAP[step]}`}
        >
          {panels[step]}
        </section>

        <div className="desk:col-start-1 desk:row-start-2 desk:w-[416px]">
          <TotalCard amount={formatTotal(hasDates ? draft.total : 0, yacht.currency)} />
          <CheckoutCta className="mt-10 desk:mt-2" {...cta} />
        </div>
      </main>
    </div>
  );
}
