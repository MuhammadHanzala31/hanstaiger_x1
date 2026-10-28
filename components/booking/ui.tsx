import type { ReactNode } from "react";

// Shared pieces of the booking wizard. Sizes, colours and icon paths are taken
// from the Figma export (1440×800 desktop, 380×800 mobile).

export function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.667 4.667L11.333 11.333M4.667 11.333L11.333 4.667" />
    </svg>
  );
}

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M7.5 3L10.5 6L7.5 9M10.5 6H1.5" />
    </svg>
  );
}

/** Accordion toggle used by the services list (15px box; the mobile sheet rows use 15.86). */
export function PlusMinusIcon({ open, size = 15 }: { open?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="0.937" strokeLinecap="square" aria-hidden className="shrink-0 text-grey-850">
      <path d={open ? "M3.13 7.5H11.88" : "M3.13 7.5H11.88M7.53 3.126V11.874"} />
    </svg>
  );
}

export function PanelHeader({ step, title, onClear }: { step?: number; title: string; onClear: () => void }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="t-caption3 uppercase text-grey-900">
            {step ? <>Step {step} <span className="ml-[1.5px] text-grey-500">of 3</span></> : "Confirm"}
          </p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span key={n} className={`size-[2px] rounded-[0.3px] ${!step || n === step ? "bg-grey-900" : "bg-grey-400"}`} />
            ))}
          </div>
        </div>
        <button type="button" onClick={onClear} className="t-body4 text-grey-500 transition-colors hover:text-grey-900">
          Clear all
        </button>
      </div>
      <h2 className="mt-4 text-[24px]/[32px] font-medium text-grey-850">{title}</h2>
    </>
  );
}

/** Back / Continue row; pinned to the panel bottom on desktop. */
export function StepButtons({ onBack, canContinue, onContinue }: { onBack?: () => void; canContinue?: boolean; onContinue?: () => void }) {
  return (
    <div className="mt-4 flex items-center justify-between desk:mt-auto desk:pt-8">
      {onBack ? (
        <button type="button" onClick={onBack} className="t-body4 text-grey-500 transition-colors hover:text-grey-900">
          Back
        </button>
      ) : (
        <span />
      )}
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={`t-button2 flex h-10 items-center gap-2 rounded-[2px] border px-[23px] transition-colors ${
            canContinue
              ? "border-orange-400 bg-orange-400 text-white hover:border-orange-500 hover:bg-orange-500"
              : "border-grey-300 text-grey-300"
          }`}
        >
          Continue
          <ArrowIcon />
        </button>
      )}
    </div>
  );
}

export type CtaProps = {
  active: boolean;
  onClick?: () => void;
  /** Submit this form id instead of running onClick. */
  form?: string;
  note: string;
  centered?: boolean;
};

export function CheckoutCta({ active, onClick, form, note, centered, dark, className = "" }: CtaProps & { dark?: boolean; className?: string }) {
  return (
    <div className={className}>
      <button
        type={form ? "submit" : "button"}
        form={form}
        onClick={onClick}
        disabled={!active}
        className={`t-button1 h-12 w-full rounded-[2px] transition-colors ${
          active ? "bg-orange-400 text-white hover:bg-orange-500" : "border border-grey-600 text-grey-600"
        }`}
      >
        Proceed to checkout
      </button>
      <p className={`t-caption3 mt-2 uppercase ${dark ? "text-grey-850" : "text-white"} ${centered ? "text-center" : ""}`}>{note}</p>
    </div>
  );
}

/** Full-screen white sheet used by the pickers below the desktop breakpoint. */
export function Sheet({ bar, onClose, children }: { bar: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div data-sheet className="fixed inset-x-0 top-0 bottom-[88px] z-30 overflow-y-auto bg-white text-grey-900 desk:hidden">
      <div className="flex h-[65px]">
        <div className="t-body4 flex min-w-0 flex-1 items-center bg-grey-50 px-6 text-grey-700">{bar}</div>
        <div className="flex w-[68px] items-center justify-center bg-grey-150">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-[2px] bg-[linear-gradient(to_bottom_right,#abb6c5,#bec4ce)] text-grey-850"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="px-6 pb-10">{children}</div>
    </div>
  );
}
