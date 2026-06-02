"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function addBlock(formData: FormData): Promise<void> {
  const yachtId = String(formData.get("yacht_id") ?? "");
  const start = String(formData.get("start_date") ?? "");
  const end = String(formData.get("end_date") ?? "");
  const reason = String(formData.get("reason") ?? "hold");
  const note = String(formData.get("note") ?? "");
  if (!yachtId || !start || !end || end <= start) return;

  const client = createServiceClient();
  await client.from("availability_blocks").insert({
    yacht_id: yachtId,
    start_date: start,
    end_date: end,
    reason: reason === "maintenance" ? "maintenance" : "hold",
    note: note || null,
  });
  revalidatePath("/admin/availability");
}

export async function removeBlock(id: string): Promise<void> {
  const client = createServiceClient();
  await client.from("availability_blocks").delete().eq("id", id);
  revalidatePath("/admin/availability");
}
