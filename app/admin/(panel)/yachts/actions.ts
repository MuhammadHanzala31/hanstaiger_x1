"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

function eurosToCents(v: FormDataEntryValue | null): number {
  return Math.round(parseFloat(String(v ?? "0")) * 100) || 0;
}
function int(v: FormDataEntryValue | null): number {
  return parseInt(String(v ?? "0"), 10) || 0;
}
function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

export async function upsertYacht(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  const mode = str(formData.get("deposit_mode")) === "flat" ? "flat" : "percent";

  const fields = {
    slug: str(formData.get("slug")),
    name: str(formData.get("name")),
    tagline: str(formData.get("tagline")) || null,
    description: str(formData.get("description")) || null,
    hero_image: str(formData.get("hero_image")) || null,
    base_price: eurosToCents(formData.get("base_price")),
    included_guests: int(formData.get("included_guests")),
    extra_guest_price: eurosToCents(formData.get("extra_guest_price")),
    max_guests: int(formData.get("max_guests")),
    min_nights: int(formData.get("min_nights")),
    max_nights: int(formData.get("max_nights")),
    deposit_mode: mode,
    // percent: store the integer percentage; flat: store cents
    deposit_value:
      mode === "flat" ? eurosToCents(formData.get("deposit_value")) : int(formData.get("deposit_value")),
    season_start: str(formData.get("season_start")) || null,
    season_end: str(formData.get("season_end")) || null,
    is_active: formData.get("is_active") === "on",
    sort_order: int(formData.get("sort_order")),
    currency: "EUR",
  };

  const client = createServiceClient();
  if (id) {
    await client.from("yachts").update(fields).eq("id", id);
  } else {
    await client.from("yachts").insert(fields);
  }
  revalidatePath("/admin/yachts");
  redirect("/admin/yachts");
}

export async function toggleYachtActive(id: string, current: boolean): Promise<void> {
  const client = createServiceClient();
  await client.from("yachts").update({ is_active: !current }).eq("id", id);
  revalidatePath("/admin/yachts");
}
