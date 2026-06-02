import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getDraftId } from "@/lib/booking/draft-cookie";
import { formatEUR } from "@/lib/money";

export default async function ConfirmationPage() {
  const draftId = await getDraftId();
  let total = 0;
  let deposit = 0;
  let dates: string | null = null;

  if (draftId) {
    const client = createServiceClient();
    const { data } = await client
      .from("booking_drafts")
      .select("start_date, end_date, computed_total, computed_deposit")
      .eq("id", draftId)
      .maybeSingle();
    if (data) {
      total = data.computed_total;
      deposit = data.computed_deposit;
      dates =
        data.start_date && data.end_date
          ? `${data.start_date} → ${data.end_date}`
          : null;
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-grey-900 px-6 text-center">
      <p className="eyebrow">Almost there</p>
      <h1 className="t-h3 text-white">Review your reservation</h1>
      <div className="frost w-full max-w-sm rounded-md border border-white/10 p-6 text-left">
        {dates && (
          <Row label="Dates" value={dates} />
        )}
        <Row label="Total" value={formatEUR(total)} />
        <Row label="Deposit due" value={formatEUR(deposit)} highlight />
      </div>
      <p className="t-caption3 max-w-sm text-grey-500">
        Payment is wired up in the next phase (Stripe Checkout). This page
        confirms the server-computed totals for your draft.
      </p>
      <Link
        href="/"
        className="t-button1 rounded-sm border border-white/20 px-6 py-3 text-white transition-colors hover:bg-white/10"
      >
        Back to start
      </Link>
    </main>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 last:border-0">
      <span className="t-body4 text-grey-400">{label}</span>
      <span className={`t-body3 ${highlight ? "text-orange-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
