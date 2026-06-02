import "server-only";
import { cookies } from "next/headers";

const COOKIE = "hb_draft";
const MAX_AGE = 60 * 60; // 60 minutes, matches booking_drafts.expires_at

export async function getDraftId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

export async function setDraftId(id: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearDraftId(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
