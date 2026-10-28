import { PanelHeader, StepButtons } from "@/components/booking/ui";

export function GuestsPanel({
  value,
  min,
  max,
  chosen,
  onChange,
  onClear,
  onBack,
  onContinue,
}: {
  value: number;
  min: number;
  max: number;
  /** False until the guest picks a number; the count shows as a placeholder. */
  chosen: boolean;
  onChange: (n: number) => void;
  onClear: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <PanelHeader step={2} title="Choose your guests" onClear={onClear} />
      <p className="t-caption3 mt-8 uppercase text-grey-600">Guests</p>
      <div className="mt-1 flex h-10 items-center justify-between rounded-[2px] bg-[#151515]/4 px-4">
        {/* At the bounds a press still confirms the placeholder count. */}
        <StepIcon label="Decrease guests" d="M3.5 8H12.833" disabled={chosen && value <= min} onClick={() => onChange(Math.max(min, value - 1))} />
        <span aria-live="polite" className={`t-body4 tabular-nums ${chosen ? "text-grey-850" : "text-grey-700 desk:text-grey-500"}`}>
          {value}
        </span>
        <StepIcon label="Increase guests" d="M8.02 3.333L8.01 12.667M3.34 8H12.67" disabled={chosen && value >= max} onClick={() => onChange(Math.min(max, value + 1))} />
      </div>
      <StepButtons onBack={onBack} canContinue={chosen} onContinue={onContinue} />
    </>
  );
}

function StepIcon({ label, d, disabled, onClick }: { label: string; d: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="disabled:cursor-not-allowed">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-grey-850">
        <path d={d} />
      </svg>
    </button>
  );
}
