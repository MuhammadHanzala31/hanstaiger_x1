import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Yacht, ServiceWithOptions, BlockedRange } from "./types";

interface YachtRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  hero_image: string | null;
  gallery: string[] | null;
  base_price: number;
  included_guests: number;
  extra_guest_price: number;
  max_guests: number;
  min_nights: number;
  max_nights: number;
  deposit_mode: "percent" | "flat";
  deposit_value: number;
  season_start: string | null;
  season_end: string | null;
  currency: string;
}

function mapYacht(row: YachtRow): Yacht {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    heroImage: row.hero_image,
    gallery: row.gallery ?? [],
    basePrice: row.base_price,
    includedGuests: row.included_guests,
    extraGuestPrice: row.extra_guest_price,
    maxGuests: row.max_guests,
    minNights: row.min_nights,
    maxNights: row.max_nights,
    depositMode: row.deposit_mode,
    depositValue: row.deposit_value,
    seasonStart: row.season_start,
    seasonEnd: row.season_end,
    currency: row.currency,
  };
}

export async function getYachtBySlug(slug: string): Promise<Yacht | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("yachts")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return mapYacht(data as YachtRow);
}

interface YachtServiceJoinRow {
  price_override: number | null;
  services: {
    id: string;
    name: string;
    category: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    service_options: {
      id: string;
      name: string;
      price: number;
      sort_order: number;
      is_active: boolean;
    }[];
  } | null;
}

export async function getServicesForYacht(
  yachtId: string,
): Promise<ServiceWithOptions[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("yacht_services")
    .select(
      `price_override,
       services!inner (
         id, name, category, description, sort_order, is_active,
         service_options ( id, name, price, sort_order, is_active )
       )`,
    )
    .eq("yacht_id", yachtId)
    .eq("is_active", true);

  if (error || !data) return [];

  const rows = data as unknown as YachtServiceJoinRow[];
  return rows
    .filter((r) => r.services && r.services.is_active)
    .map((r) => {
      const s = r.services!;
      const options = (s.service_options ?? [])
        .filter((o) => o.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({
          id: o.id,
          name: o.name,
          // per-yacht override applies as a flat replacement when present
          price: r.price_override ?? o.price,
        }));
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        options,
        sortOrder: s.sort_order,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _sortOrder, ...rest }) => rest);
}

/**
 * Blocked ranges for the public calendar, read from `availability_blocks`
 * (public-readable). Every confirmed booking creates a block (reason 'booked')
 * via the Phase 3 webhook, so blocks are the single source of truth here.
 */
export async function getAvailability(yachtId: string): Promise<BlockedRange[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_blocks")
    .select("start_date, end_date")
    .eq("yacht_id", yachtId);

  return (data ?? []).map((b) => ({ start: b.start_date, end: b.end_date }));
}
