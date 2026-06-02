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
  const [pending, startTransition] = useTransition();
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-md border border-white/15 bg-white/5 px-3 py-2">
        <StepButton label="Decrease guests" disabled={optimistic <= min} onClick={() => set(optimistic - 1)}>
          –
        </StepButton>
        <span className="t-h6 tabular-nums text-white" aria-live="polite">
          {optimistic}
        </span>
        <StepButton label="Increase guests" disabled={optimistic >= max} onClick={() => set(optimistic + 1)}>
          +
        </StepButton>
      </div>
      <p className="t-caption3 text-grey-500">
        Includes {min} guests · up to {max}
        {pending ? " · updating…" : ""}
      </p>
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
