import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Atomically claims the right to send a resend email to this address right
 * now — true if allowed (and the cooldown is immediately reset), false if
 * still within the 24h window. Implemented as a single database round trip
 * (see 0011_atomic_resend_claim.sql) so concurrent requests for the same
 * email can't all pass a "check" before any of them "sets" the cooldown.
 */
export async function claimResendSlot(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("try_claim_resend", { p_email: email });
  if (error) throw error;
  return data === true;
}
