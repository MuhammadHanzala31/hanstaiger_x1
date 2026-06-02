import { computeBreakdown } from "@/lib/pricing";
import type { SelectedOption } from "@/lib/types";
import type { Yacht } from "./types";

export interface LineItem {
  label: string;
  amount: number;
}

export interface RepriceResult {
  total: number;
  deposit: number;
  lineItems: LineItem[];
}

/**
 * Pure, server-authoritative repricing. Adapts a Yacht view model into the
 * pricing engine and produces a human-readable line-item breakdown whose
 * amounts always sum to `total`.
 */
export function repriceDraft(
  yacht: Yacht,
  guests: number,
  options: SelectedOption[],
): RepriceResult {
  const b = computeBreakdown(
    {
      basePrice: yacht.basePrice,
      includedGuests: yacht.includedGuests,
      extraGuestPrice: yacht.extraGuestPrice,
      maxGuests: yacht.maxGuests,
      depositMode: yacht.depositMode,
      depositValue: yacht.depositValue,
    },
    guests,
    options,
  );

  const lineItems: LineItem[] = [{ label: "Charter", amount: b.base }];
  const extraGuests = Math.max(0, guests - yacht.includedGuests);
  if (extraGuests > 0) {
    lineItems.push({
      label: `Additional guests (${extraGuests})`,
      amount: b.guestExtra,
    });
  }
  for (const opt of options) {
    lineItems.push({ label: opt.name, amount: opt.price });
  }

  return { total: b.total, deposit: b.deposit, lineItems };
}
