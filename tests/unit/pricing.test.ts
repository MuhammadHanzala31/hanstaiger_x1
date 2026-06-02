import { describe, it, expect } from 'vitest';
import { computeBreakdown } from '@/lib/pricing';
import type { YachtPricing, SelectedOption } from '@/lib/types';

const yacht: YachtPricing = {
  basePrice: 2000000, includedGuests: 4, extraGuestPrice: 500000,
  maxGuests: 12, depositMode: 'percent', depositValue: 20,
};

describe('computeBreakdown', () => {
  it('charges only base when guests are within included and no services', () => {
    const b = computeBreakdown(yacht, 4, []);
    expect(b.base).toBe(2000000);
    expect(b.guestExtra).toBe(0);
    expect(b.servicesSum).toBe(0);
    expect(b.total).toBe(2000000);
    expect(b.deposit).toBe(400000);
  });
  it('adds extra-guest cost above included guests', () => {
    const b = computeBreakdown(yacht, 6, []);
    expect(b.guestExtra).toBe(1000000);
    expect(b.total).toBe(3000000);
  });
  it('sums selected service options', () => {
    const opts: SelectedOption[] = [
      { optionId: 'a', name: 'Dinner', price: 120000 },
      { optionId: 'b', name: 'Jetskis', price: 100000 },
    ];
    const b = computeBreakdown(yacht, 4, opts);
    expect(b.servicesSum).toBe(220000);
    expect(b.total).toBe(2220000);
    expect(b.deposit).toBe(444000);
  });
  it('uses flat deposit when mode is flat', () => {
    const flat: YachtPricing = { ...yacht, depositMode: 'flat', depositValue: 300000 };
    const b = computeBreakdown(flat, 4, []);
    expect(b.deposit).toBe(300000);
  });
  it('never charges negative guest extra below included guests', () => {
    const b = computeBreakdown(yacht, 2, []);
    expect(b.guestExtra).toBe(0);
  });
});
