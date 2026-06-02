"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-grey-900 px-6">
      <form
        action={action}
        className="frost w-full max-w-sm rounded-lg border border-white/10 p-8"
      >
        <p className="eyebrow mb-2">Hanstaiger</p>
        <h1 className="t-h6 mb-6 text-white">Admin sign in</h1>

        <label className="mb-3 flex flex-col gap-1">
          <span className="t-caption3 text-grey-400">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="t-body3 rounded-sm border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-orange-400"
          />
        </label>
        <label className="mb-4 flex flex-col gap-1">
          <span className="t-caption3 text-grey-400">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="t-body3 rounded-sm border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-orange-400"
          />
        </label>

        {state?.error && (
          <p className="t-caption3 mb-3 text-obsession-red">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="t-button1 w-full rounded-sm bg-orange-400 px-6 py-3 text-white transition-colors hover:bg-orange-500 disabled:opacity-40"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
