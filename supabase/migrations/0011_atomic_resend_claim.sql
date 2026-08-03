-- The "resend my purchases" cooldown was check-then-set from the app (read
-- last_sent_at, decide, write) — two requests arriving at nearly the same
-- time could both pass the check before either had written, sending more
-- than one email per email address per day. This makes the check-and-claim
-- a single atomic database operation instead.

create or replace function try_claim_resend(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean;
begin
  insert into email_resend_log (email, last_sent_at)
  values (p_email, now())
  on conflict (email) do update
    set last_sent_at = now()
    where email_resend_log.last_sent_at < now() - interval '24 hours'
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

-- Postgres grants EXECUTE on new functions to PUBLIC by default, which
-- would let the public anon key call this over PostgREST's /rpc endpoint
-- directly (bypassing the app entirely) to reset or probe any email's
-- cooldown. The app only ever calls this with the service role, which
-- ignores grants anyway, so lock everyone else out explicitly.
revoke all on function try_claim_resend(text) from public, anon, authenticated;
