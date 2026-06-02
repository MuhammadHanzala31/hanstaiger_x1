import { notFound } from "next/navigation";
import {
  getYachtBySlug,
  getServicesForYacht,
  getAvailability,
} from "@/lib/booking/queries";
import { ensureDraft } from "@/lib/booking/draft-actions";
import { BookingWizard } from "./BookingWizard";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const yacht = await getYachtBySlug(slug);
  if (!yacht) notFound();

  const [services, blocked, draft] = await Promise.all([
    getServicesForYacht(yacht.id),
    getAvailability(yacht.id),
    ensureDraft(yacht.id),
  ]);

  return (
    <BookingWizard
      yacht={yacht}
      services={services}
      blocked={blocked}
      initialDraft={draft}
    />
  );
}
