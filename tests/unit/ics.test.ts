import { describe, it, expect } from "vitest";
import { addDays, buildEvent, buildCalendar, googleCalendarUrl } from "@/lib/calendar/ics";

const ev = {
  uid: "booking-1@hanstaiger",
  start: "2026-08-10",
  end: "2026-08-14",
  title: "Hanstaiger X1 charter",
  description: "4 guests",
  location: "Marina",
};

describe("calendar helpers", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("builds an all-day VEVENT with exclusive DTEND", () => {
    const out = buildEvent(ev);
    expect(out).toContain("DTSTART;VALUE=DATE:20260810");
    expect(out).toContain("DTEND;VALUE=DATE:20260815"); // 14th + 1 (exclusive)
    expect(out).toContain("SUMMARY:Hanstaiger X1 charter");
    expect(out).toContain("BEGIN:VEVENT");
    expect(out).toContain("END:VEVENT");
  });

  it("wraps events in a VCALENDAR", () => {
    const cal = buildCalendar([ev]);
    expect(cal.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(cal.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("builds a Google Calendar template URL with exclusive end", () => {
    const url = googleCalendarUrl(ev);
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20260810%2F20260815");
    expect(url).toContain("text=Hanstaiger");
  });
});
