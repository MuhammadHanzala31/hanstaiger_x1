import { describe, it, expect } from "vitest";
import { buildLineItems } from "@/lib/booking/checkout-core";
import type { Yacht } from "@/lib/booking/types";
import type { SelectedOption } from "@/lib/types";

const x1: Yacht = {
  id: "y1",
  slug: "x1",
  name: "Hanstaiger X1",
  tagline: null,
  description: null,
  heroImage: null,
  gallery: [],
  basePrice: 2000000,
  includedGuests: 4,
  extraGuestPrice: 500000,
  maxGuests: 12,
  minNights: 3,
  maxNights: 14,
  depositMode: "percent",
  depositValue: 20,
  seasonStart: "2026-05-01",
  seasonEnd: "2026-10-31",
  currency: "EUR",
};

describe("buildLineItems", () => {
  it("produces a persistable snapshot with total and deposit", () => {
    const opts: SelectedOption[] = [
      { optionId: "o-dinner", name: "Dinner", price: 120000 },
    ];
    const snap = buildLineItems(x1, 6, opts);
    expect(snap.total).toBe(3120000);
    expect(snap.deposit).toBe(624000);
    const labels = snap.lineItems.map((l) => l.label);
    expect(labels).toEqual(["Charter", "Additional guests (2)", "Dinner"]);
    expect(snap.lineItems.reduce((s, l) => s + l.amount, 0)).toBe(snap.total);
  });
});
