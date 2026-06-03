/**
 * Calendar helpers — build RFC 5545 (.ics) content and Google Calendar
 * template links for a charter booking. Charters are all-day, multi-day events.
 */

export interface CalendarEventInput {
  uid: string;
  /** inclusive departure date, ISO yyyy-mm-dd */
  start: string;
  /** inclusive return date, ISO yyyy-mm-dd */
  end: string;
  title: string;
  description?: string;
  location?: string;
}

function ymd(iso: string): string {
  return iso.replace(/-/g, "");
}

/** Add days to an ISO date, returning ISO. */
export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** A single VEVENT. DTEND is exclusive, so we add one day to the inclusive return. */
export function buildEvent(e: CalendarEventInput): string {
  const dtEndExclusive = ymd(addDays(e.end, 1));
  const lines = [
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "")}`,
    `DTSTART;VALUE=DATE:${ymd(e.start)}`,
    `DTEND;VALUE=DATE:${dtEndExclusive}`,
    `SUMMARY:${escapeText(e.title)}`,
  ];
  if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
  if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

/** A full VCALENDAR wrapping one or more events. */
export function buildCalendar(events: CalendarEventInput[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hanstaiger//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.map(buildEvent),
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Google Calendar "add event" template URL (all-day, end exclusive). */
export function googleCalendarUrl(e: CalendarEventInput): string {
  const dates = `${ymd(e.start)}/${ymd(addDays(e.end, 1))}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates,
  });
  if (e.description) params.set("details", e.description);
  if (e.location) params.set("location", e.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
