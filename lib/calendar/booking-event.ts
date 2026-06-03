import type { CalendarEventInput } from "./ics";

export interface BookingForCalendar {
  id: string;
  start_date: string;
  end_date: string;
  guests: number;
  customer_name?: string;
  yachtName: string;
}

/** Map a booking into a calendar event input. */
export function bookingToEvent(b: BookingForCalendar): CalendarEventInput {
  return {
    uid: `booking-${b.id}@hanstaiger`,
    start: b.start_date,
    end: b.end_date,
    title: `${b.yachtName} charter`,
    description: [
      b.customer_name ? `Guest: ${b.customer_name}` : null,
      `Guests: ${b.guests}`,
      `Reservation ${b.id}`,
    ]
      .filter(Boolean)
      .join(" · "),
    location: b.yachtName,
  };
}
