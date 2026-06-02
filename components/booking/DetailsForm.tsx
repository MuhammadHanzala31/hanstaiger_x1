"use client";

import { useState } from "react";
import { formatEUR } from "@/lib/money";

export function DetailsForm({
  deposit,
  onProceed,
}: {
  deposit: number;
  onProceed: (customer: { name: string; email: string; phone: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const valid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onProceed({ name, email, phone });
      }}
      className="frost flex flex-col gap-3 rounded-md border border-white/10 p-4"
    >
      <Field label="Full name" value={name} onChange={setName} type="text" required />
      <Field label="Email" value={email} onChange={setEmail} type="email" required />
      <Field label="Phone" value={phone} onChange={setPhone} type="tel" />

      <p className="t-caption3 text-grey-500">
        Secure your reservation with a {formatEUR(deposit)} deposit, non-refundable
        per booking conditions.
      </p>

      <button
        type="submit"
        disabled={!valid}
        className="t-button1 mt-1 rounded-sm bg-orange-400 px-6 py-3 text-white transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Proceed to checkout · {formatEUR(deposit)}
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
        className="t-body3 rounded-sm border border-white/15 bg-white/5 px-3 py-2 text-white outline-none transition-colors focus:border-orange-400"
      />
    </label>
  );
}
