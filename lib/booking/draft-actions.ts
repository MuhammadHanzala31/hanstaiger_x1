"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { validateRange } from "@/lib/availability";
import type { SelectedOption } from "@/lib/types";
import type { DraftState, Yacht } from "./types";
import { repriceDraft } from "./reprice";
import { getDraftId, setDraftId } from "./draft-cookie";

interface DraftRow {
  id: string;
  yacht_id: string;
  start_date: string | null;
  end_date: string | null;
  guests: number;
  selected_options: SelectedOption[];
  computed_total: number;
  computed_deposit: number;
  expires_at: string;
  status: string;
}

function rowToState(row: DraftRow): DraftState {
  return {
    id: row.id,
    yachtId: row.yacht_id,
    startDate: row.start_date,
    endDate: row.end_date,
    guests: row.guests,
    selectedOptions: row.selected_options ?? [],
    total: row.computed_total,
    deposit: row.computed_deposit,
  };
}

async function loadYacht(
  client: ReturnType<typeof createServiceClient>,
  yachtId: string,
): Promise<Yacht | null> {
  const { data } = await client.from("yachts").select("*").eq("id", yachtId).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    tagline: data.tagline,
    description: data.description,
    heroImage: data.hero_image,
    gallery: data.gallery ?? [],
    basePrice: data.base_price,
    includedGuests: data.included_guests,
    extraGuestPrice: data.extra_guest_price,
    maxGuests: data.max_guests,
    minNights: data.min_nights,
    maxNights: data.max_nights,
    depositMode: data.deposit_mode,
    depositValue: data.deposit_value,
    seasonStart: data.season_start,
    seasonEnd: data.season_end,
    currency: data.currency,
  };
}

async function loadDraftRow(
  client: ReturnType<typeof createServiceClient>,
  id: string,
): Promise<DraftRow | null> {
  const { data } = await client
    .from("booking_drafts")
    .select("*")
    .eq("id", id)
    .eq("status", "draft")
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data as DraftRow;
}

/** Reprice from current row + yacht and persist; returns the fresh state. */
async function repersist(
  client: ReturnType<typeof createServiceClient>,
  row: DraftRow,
): Promise<DraftState> {
  const yacht = await loadYacht(client, row.yacht_id);
  if (!yacht) throw new Error("Yacht not found for draft");
  const { total, deposit } = repriceDraft(yacht, row.guests, row.selected_options ?? []);
  const { data } = await client
    .from("booking_drafts")
    .update({
      start_date: row.start_date,
      end_date: row.end_date,
      guests: row.guests,
      selected_options: row.selected_options ?? [],
      computed_total: total,
      computed_deposit: deposit,
    })
    .eq("id", row.id)
    .select("*")
    .single();
  return rowToState(data as DraftRow);
}

/** Reuse the cookie's draft if still valid; otherwise create a new one. */
export async function ensureDraft(yachtId: string): Promise<DraftState> {
  const client = createServiceClient();
  const existingId = await getDraftId();
  if (existingId) {
    const row = await loadDraftRow(client, existingId);
    if (row && row.yacht_id === yachtId) return rowToState(row);
  }

  const yacht = await loadYacht(client, yachtId);
  if (!yacht) throw new Error("Yacht not found");
  const { total, deposit } = repriceDraft(yacht, yacht.includedGuests, []);
  const { data } = await client
    .from("booking_drafts")
    .insert({
      yacht_id: yachtId,
      guests: yacht.includedGuests,
      selected_options: [],
      computed_total: total,
      computed_deposit: deposit,
    })
    .select("*")
    .single();
  const row = data as DraftRow;
  await setDraftId(row.id);
  return rowToState(row);
}

export type DatesResult =
  | { ok: true; state: DraftState }
  | { ok: false; reason: string };

export async function setDates(start: string, end: string): Promise<DatesResult> {
  const client = createServiceClient();
  const id = await getDraftId();
  if (!id) return { ok: false, reason: "no_draft" };
  const row = await loadDraftRow(client, id);
  if (!row) return { ok: false, reason: "no_draft" };

  const yacht = await loadYacht(client, row.yacht_id);
  if (!yacht) return { ok: false, reason: "no_draft" };

  const { data: blocks } = await client
    .from("availability_blocks")
    .select("start_date, end_date")
    .eq("yacht_id", row.yacht_id);
  const blocked = (blocks ?? []).map((b) => ({ start: b.start_date, end: b.end_date }));

  const result = validateRange(
    start,
    end,
    {
      minNights: yacht.minNights,
      maxNights: yacht.maxNights,
      seasonStart: yacht.seasonStart,
      seasonEnd: yacht.seasonEnd,
    },
    blocked,
  );
  if (!result.ok) return { ok: false, reason: result.reason };

  const state = await repersist(client, { ...row, start_date: start, end_date: end });
  return { ok: true, state };
}

export async function setGuests(guests: number): Promise<DraftState> {
  const client = createServiceClient();
  const id = await getDraftId();
  if (!id) throw new Error("no_draft");
  const row = await loadDraftRow(client, id);
  if (!row) throw new Error("no_draft");
  const yacht = await loadYacht(client, row.yacht_id);
  if (!yacht) throw new Error("no_draft");
  const clamped = Math.min(yacht.maxGuests, Math.max(yacht.includedGuests, Math.round(guests)));
  return repersist(client, { ...row, guests: clamped });
}

export async function setServices(options: SelectedOption[]): Promise<DraftState> {
  const client = createServiceClient();
  const id = await getDraftId();
  if (!id) throw new Error("no_draft");
  const row = await loadDraftRow(client, id);
  if (!row) throw new Error("no_draft");
  return repersist(client, { ...row, selected_options: options });
}
