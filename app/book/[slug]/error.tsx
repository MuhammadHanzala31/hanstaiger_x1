"use client";

import Link from "next/link";

export default function BookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-grey-900 px-6 text-center">
      <p className="eyebrow">Hanstaiger</p>
      <h1 className="t-title3 max-w-xl text-white">
        Booking page is temporarily unavailable
      </h1>
      <p className="t-body2 max-w-md text-grey-300">
        {error.message ||
          "We could not reach our database. Please try again in a moment."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="t-button1 rounded-sm bg-orange-400 px-7 py-3 text-white transition-colors hover:bg-orange-500"
        >
          Try again
        </button>
        <Link
          href="/"
          className="t-button1 rounded-sm border border-white/25 px-7 py-3 text-white transition-colors hover:bg-white/10"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
