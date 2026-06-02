import { notFound } from "next/navigation";
import {
  getYachtBySlug,
  getServicesForYacht,
  getAvailability,
} from "@/lib/booking/queries";
import { initialDraftState } from "@/lib/booking/initial-draft";
import { BookingWizard } from "./BookingWizard";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const yacht = await getYachtBySlug(slug);
  if (!yacht) notFound();

  const [services, blocked] = await Promise.all([
    getServicesForYacht(yacht.id),
    getAvailability(yacht.id),
  ]);

  return (
    <BookingWizard
      yacht={yacht}
      services={services}
      blocked={blocked}
      initialDraft={initialDraftState(yacht)}
    />
  );
}
