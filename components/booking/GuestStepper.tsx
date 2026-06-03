"use client";

import { useState, useTransition } from "react";

export function GuestStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => Promise<void>;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(value);

  const set = (n: number) => {
    const clamped = Math.min(max, Math.max(min, n));
    if (clamped === optimistic) return;
    setOptimistic(clamped);
    startTransition(async () => {
      await onChange(clamped);
    });
  };

  return (
    <div className="flex h-12 w-full items-center justify-between gap-6 rounded-[2px] bg-grey-900 px-4 md:w-auto md:justify-start">
      <StepButton label="Decrease guests" disabled={optimistic <= min} onClick={() => set(optimistic - 1)}>
        –
      </StepButton>
      <span className="t-body3 w-6 text-center tabular-nums text-white" aria-live="polite">
        {optimistic}
      </span>
      <StepButton label="Increase guests" disabled={optimistic >= max} onClick={() => set(optimistic + 1)}>
        +
      </StepButton>
    </div>
  );
}

function StepButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
