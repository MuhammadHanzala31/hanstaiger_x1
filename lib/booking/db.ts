import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { SelectedOption } from "@/lib/types";
import type { BlockedRange, Yacht } from "./types";

export type ServiceClient = ReturnType<typeof createServiceClient>;

export interface DraftRow {
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

export function mapYachtRow(data: Record<string, unknown>): Yacht {
  return {
    id: data.id as string,
    slug: data.slug as string,
    name: data.name as string,
    tagline: (data.tagline as string) ?? null,
    description: (data.description as string) ?? null,
    heroImage: (data.hero_image as string) ?? null,
    gallery: (data.gallery as string[]) ?? [],
    basePrice: data.base_price as number,
    includedGuests: data.included_guests as number,
    extraGuestPrice: data.extra_guest_price as number,
    maxGuests: data.max_guests as number,
    minNights: data.min_nights as number,
    maxNights: data.max_nights as number,
    depositMode: data.deposit_mode as "percent" | "flat",
    depositValue: data.deposit_value as number,
    seasonStart: (data.season_start as string) ?? null,
    seasonEnd: (data.season_end as string) ?? null,
    currency: data.currency as string,
  };
}

export async function loadYachtById(
  client: ServiceClient,
  yachtId: string,
): Promise<Yacht | null> {
  const { data } = await client.from("yachts").select("*").eq("id", yachtId).maybeSingle();
  return data ? mapYachtRow(data) : null;
}

export async function loadDraftRow(
  client: ServiceClient,
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

export async function loadBlockedRanges(
  client: ServiceClient,
  yachtId: string,
): Promise<BlockedRange[]> {
  const { data } = await client
    .from("availability_blocks")
    .select("start_date, end_date")
    .eq("yacht_id", yachtId);
  return (data ?? []).map((b) => ({ start: b.start_date, end: b.end_date }));
}
