import { repriceDraft } from "./reprice";
import type { DraftState, Yacht } from "./types";

/**
 * In-memory initial draft state for first render. Does NOT touch the DB or
 * cookies (Server Components may not write cookies). The real draft row is
 * created lazily on the first mutation. `id` is empty until then.
 */
export function initialDraftState(yacht: Yacht): DraftState {
  const { total, deposit } = repriceDraft(yacht, yacht.includedGuests, []);
  return {
    id: "",
    yachtId: yacht.id,
    startDate: null,
    endDate: null,
    guests: yacht.includedGuests,
    selectedOptions: [],
    total,
    deposit,
  };
}
