"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

function eurosToCents(v: FormDataEntryValue | null): number {
  return Math.round(parseFloat(String(v ?? "0")) * 100) || 0;
}
function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

/** Create a service and link it to every yacht so it appears in booking flows. */
export async function addService(formData: FormData): Promise<void> {
  const name = str(formData.get("name"));
  const category = str(formData.get("category")) || "general";
  if (!name) return;

  const client = createServiceClient();
  const { data: service } = await client
    .from("services")
    .insert({ name, category })
    .select("id")
    .single();

  if (service) {
    const { data: yachts } = await client.from("yachts").select("id");
    if (yachts?.length) {
      await client
        .from("yacht_services")
        .insert(yachts.map((y) => ({ yacht_id: y.id, service_id: service.id })));
    }
  }
  revalidatePath("/admin/services");
}

export async function deleteService(id: string): Promise<void> {
  const client = createServiceClient();
  await client.from("services").delete().eq("id", id); // cascades options + links
  revalidatePath("/admin/services");
}

export async function addOption(formData: FormData): Promise<void> {
  const serviceId = str(formData.get("service_id"));
  const name = str(formData.get("name"));
  if (!serviceId || !name) return;
  const client = createServiceClient();
  await client.from("service_options").insert({
    service_id: serviceId,
    name,
    price: eurosToCents(formData.get("price")),
  });
  revalidatePath("/admin/services");
}

export async function updateOption(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (!id) return;
  const client = createServiceClient();
  await client
    .from("service_options")
    .update({ name: str(formData.get("name")), price: eurosToCents(formData.get("price")) })
    .eq("id", id);
  revalidatePath("/admin/services");
}

export async function deleteOption(id: string): Promise<void> {
  const client = createServiceClient();
  await client.from("service_options").delete().eq("id", id);
  revalidatePath("/admin/services");
}
