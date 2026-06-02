import type { YachtPricing, SelectedOption, PriceBreakdown } from './types';

export function computeBreakdown(
  yacht: YachtPricing,
  guests: number,
  options: SelectedOption[],
): PriceBreakdown {
  const base = yacht.basePrice;
  const extraGuests = Math.max(0, guests - yacht.includedGuests);
  const guestExtra = extraGuests * yacht.extraGuestPrice;
  const servicesSum = options.reduce((sum, o) => sum + o.price, 0);
  const total = base + guestExtra + servicesSum;
  const deposit =
    yacht.depositMode === 'percent'
      ? Math.round((total * yacht.depositValue) / 100)
      : yacht.depositValue;
  return { base, guestExtra, servicesSum, total, deposit };
}
