export type DepositMode = 'percent' | 'flat';

export interface YachtPricing {
  basePrice: number;          // cents, flat per charter
  includedGuests: number;
  extraGuestPrice: number;    // cents per extra guest
  maxGuests: number;
  depositMode: DepositMode;
  depositValue: number;       // percent (0-100) or cents (flat)
}

export interface SelectedOption {
  optionId: string;
  name: string;
  price: number;              // cents
}

export interface PriceBreakdown {
  base: number;
  guestExtra: number;
  servicesSum: number;
  total: number;
  deposit: number;
}
