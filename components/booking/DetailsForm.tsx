"use client";

import { useState, useTransition } from "react";
import { formatEUR } from "@/lib/money";

export function DetailsForm({
  deposit,
  onProceed,
}: {
  deposit: number;
  /** Returns an error message to display, or void on success (redirect happens). */
  onProceed: (customer: {
    name: string;
    email: string;
    phone: string;
  }) => Promise<string | void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || pending) return;
        setError(null);
        startTransition(async () => {
          const msg = await onProceed({ name, email, phone });
          if (msg) setError(msg);
        });
      }}
      className="frost flex flex-col gap-2 rounded-md border border-white/10 md:p-4 p-2"
    >
      <Field label="Full name" value={name} onChange={setName} type="text" required />
      <Field label="Email" value={email} onChange={setEmail} type="email" required />
      <Field label="Phone" value={phone} onChange={setPhone} type="tel" />

      <p className="t-caption3 text-grey-500">
        Secure your reservation with a {formatEUR(deposit)} deposit, non-refundable
        per booking conditions.
      </p>

      {error && <p className="t-caption3 text-obsession-red">{error}</p>}

      <button
        type="submit"
        disabled={!valid || pending}
        className="t-button1 mt-1 rounded-sm bg-orange-400 px-6 py-3 text-white transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Redirecting…" : `Proceed to checkout · ${formatEUR(deposit)}`}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="t-caption3 text-grey-400">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="t-body3 rounded-sm border border-white/15 bg-white/5 px-3 py-1 text-white outline-none transition-colors focus:border-orange-400"
      />
    </label>
  );
}
