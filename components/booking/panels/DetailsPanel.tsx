"use client";

import { useRef, useState, useTransition, type InputHTMLAttributes } from "react";
import { PanelHeader, StepButtons } from "@/components/booking/ui";

type Customer = { name: string; email: string; phone: string };

/** Contact details for the booking; submitted by the page's "Proceed to checkout" button. */
export function DetailsPanel({ onProceed, onBack }: { onProceed: (c: Customer) => Promise<string | void>; onBack: () => void }) {
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <PanelHeader title="Confirm your details" onClear={() => form.current?.reset()} />
      <form
        id="details-form"
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const data = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            const msg = await onProceed({
              name: String(data.get("name")).trim(),
              email: String(data.get("email")).trim(),
              phone: String(data.get("phone")).trim(),
            });
            if (msg) setError(msg);
          });
        }}
        className="mt-8 grid grid-cols-2 gap-x-2 gap-y-4"
      >
        <Field label="Full name" name="name" autoComplete="name" required minLength={2} className="col-span-2" />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
      </form>
      {(error || pending) && (
        <p className={`t-caption3 mt-3 uppercase ${error ? "text-obsession-red" : "text-grey-500"}`}>{error ?? "Redirecting to secure checkout…"}</p>
      )}
      <StepButtons onBack={onBack} />
    </>
  );
}

function Field({ label, className, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={className}>
      <span className="t-caption3 block uppercase text-grey-600">{label}</span>
      <input
        {...input}
        className="t-body4 mt-1 h-10 w-full rounded-[2px] bg-[#151515]/4 px-4 text-grey-700 outline-none focus:ring-1 focus:ring-grey-300"
      />
    </label>
  );
}
