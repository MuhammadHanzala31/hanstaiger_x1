import type { DepositMode, SelectedOption } from "@/lib/types";

/** Camel-cased view model of a `yachts` row, including all pricing fields. */
export interface Yacht {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  heroImage: string | null;
  gallery: string[];
  basePrice: number;
  includedGuests: number;
  extraGuestPrice: number;
  maxGuests: number;
  minNights: number;
  maxNights: number;
  depositMode: DepositMode;
  depositValue: number;
  seasonStart: string | null;
  seasonEnd: string | null;
  currency: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  price: number;
}

export interface ServiceWithOptions {
  id: string;
  name: string;
  category: string;
  description: string | null;
  options: ServiceOption[];
}

/** A blocked date range (inclusive start, exclusive end) for the calendar. */
export interface BlockedRange {
  start: string;
  end: string;
}

/** The client-facing snapshot of a booking draft. */
export interface DraftState {
  id: string;
  yachtId: string;
  startDate: string | null;
  endDate: string | null;
  guests: number;
  selectedOptions: SelectedOption[];
  total: number;
  deposit: number;
}

export type WizardStep = "dates" | "guests" | "services" | "details";
