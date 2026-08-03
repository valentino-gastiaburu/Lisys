import "server-only";
import { cookies } from "next/headers";

export const COUNTRY_COOKIE = "country";

/**
 * Whether to show soles alongside dollars. True when the visitor is in Peru,
 * and also when we don't know (local dev, or the geo lookup came back
 * empty) — showing an extra price never confuses anyone, hiding a real
 * Peruvian visitor's soles price would.
 */
export async function shouldShowSoles(): Promise<boolean> {
  const store = await cookies();
  const country = store.get(COUNTRY_COOKIE)?.value;
  return !country || country === "PE";
}
