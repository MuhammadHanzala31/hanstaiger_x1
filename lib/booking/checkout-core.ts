import { repriceDraft, type LineItem } from "./reprice";
import type { Yacht } from "./types";
import type { SelectedOption } from "@/lib/types";

export interface BookingSnapshot {
  lineItems: LineItem[];
  total: number;
  deposit: number;
}

/**
 * Pure builder for the persisted booking snapshot. Reuses the server-
 * authoritative pricing so the stored `line_items` always sum to `total`
 * and never drift when admin prices change later.
 */
export function buildLineItems(
  yacht: Yacht,
  guests: number,
  options: SelectedOption[],
): BookingSnapshot {
  const { lineItems, total, deposit } = repriceDraft(yacht, guests, options);
  return { lineItems, total, deposit };
}
