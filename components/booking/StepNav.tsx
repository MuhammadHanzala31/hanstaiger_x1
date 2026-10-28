import { STEPS } from "@/lib/booking/steps";
import { nightsBetween, shortDate } from "@/lib/booking/stepValue";
import type { DraftState, WizardStep } from "@/lib/booking/types";

export function StepNav({
  active,
  reached,
  draft,
  guestsChosen,
  onSelect,
}: {
  active: WizardStep;
  /** Index of the furthest step the guest has opened; later rows are inert. */
  reached: number;
  draft: DraftState;
  guestsChosen: boolean;
  onSelect: (s: WizardStep) => void;
}) {
  const { startDate: start, endDate: end } = draft;
  const values: Record<WizardStep, string> = {
    dates: start && end ? `${shortDate(start)} - ${shortDate(end)}` : "-",
    guests: guestsChosen ? String(draft.guests) : "-",
    services: draft.selectedOptions.length ? String(draft.selectedOptions.length) : "-",
    details: "-",
  };

  return (
    <nav className="flex flex-col gap-4">
      {STEPS.map((s, i) => {
        const on = s.key === active;
        return (
          <button
            key={s.key}
            type="button"
            disabled={i > reached}
            onClick={() => onSelect(s.key)}
            aria-current={on ? "step" : undefined}
            className={`t-caption3 flex h-[15px] items-center text-left uppercase ${on ? "text-white" : "text-grey-200"}`}
          >
            <span className={`size-[2px] shrink-0 rounded-[0.3px] ${on ? "bg-white" : ""}`} />
            <span className="ml-4 w-[66px] shrink-0">{s.label}</span>
            {values[s.key]}
            {s.key === "dates" && start && end && (
              <>
                <span className="ml-4">{nightsBetween(start, end)}</span>
                <Icon d="M7.013 1.103C5.646 1.459 4.636 2.703 4.636 4.182C4.636 5.939 6.061 7.364 7.818 7.364C9.297 7.364 10.541 6.354 10.897 4.987C10.965 5.314 11 5.653 11 6C11 8.761 8.761 11 6 11C3.239 11 1 8.761 1 6C1 3.239 3.239 1 6 1C6.347 1 6.686 1.035 7.013 1.103Z" />
              </>
            )}
            {s.key === "guests" && <Icon d="M8 3C8 4.105 7.105 5 6 5C4.895 5 4 4.105 4 3C4 1.895 4.895 1 6 1C7.105 1 8 1.895 8 3ZM10.5 11C10.5 8.515 8.485 6.5 6 6.5C3.515 6.5 1.5 8.515 1.5 11" />}
          </button>
        );
      })}
    </nav>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="ml-0.5 shrink-0">
      <path d={d} />
    </svg>
  );
}
