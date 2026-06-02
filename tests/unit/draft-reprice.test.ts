import { describe, it, expect } from "vitest";
import { repriceDraft } from "@/lib/booking/reprice";
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

describe("repriceDraft", () => {
  it("computes total, deposit, and line items for guests + one service option", () => {
    const opts: SelectedOption[] = [
      { optionId: "o-dinner", name: "Dinner", price: 120000 },
    ];
    const r = repriceDraft(x1, 6, opts);

    expect(r.total).toBe(3120000); // 2,000,000 + 2*500,000 + 120,000
    expect(r.deposit).toBe(624000); // 20%

    const labels = r.lineItems.map((l) => l.label);
    expect(labels).toContain("Charter");
    expect(labels).toContain("Additional guests (2)");
    expect(labels).toContain("Dinner");

    const totalFromLines = r.lineItems.reduce((s, l) => s + l.amount, 0);
    expect(totalFromLines).toBe(r.total);
  });

  it("omits the guest line when no extra guests are added", () => {
    const r = repriceDraft(x1, 4, []);
    expect(r.total).toBe(2000000);
    expect(r.lineItems.map((l) => l.label)).not.toContain("Additional guests (0)");
  });
});
