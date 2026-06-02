"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

/** Cancel a booking and free the dates it was holding. */
export async function cancelBooking(id: string): Promise<void> {
  const client = createServiceClient();
  await client.from("bookings").update({ status: "cancelled" }).eq("id", id);
  // Remove the auto-created 'booked' block so the calendar frees these dates.
  await client
    .from("availability_blocks")
    .delete()
    .eq("reason", "booked")
    .eq("note", `Booking ${id}`);
  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${id}`);
}
