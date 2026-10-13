-- Short reviews: no title, and the written text needs only 10 characters
-- (two or three words). Text stays required: a rating has to say why.
--
-- Safe to run more than once, including on a database where an earlier
-- version of this file (optional text) was already applied.

begin;

alter table public.reviews drop column if exists title;

alter table public.reviews drop constraint if exists reviews_body_check;

-- Star-only ratings posted while text was optional can't stay published
-- under the new rule. Keep them (nothing is deleted) but hide them, with a
-- note the author sees in their account. They no longer count in scores.
select set_config('smoch.internal', 'on', true);
update public.reviews
   set body = '(דירוג בלי טקסט)',
       status = 'hidden',
       moderation_note = 'הדירוג נוצר בלי טקסט, לפני שכתיבת ביקורת הפכה לחובה. אפשר לערוך ולהוסיף כמה מילים.'
 where body is null or btrim(body) = '';
select set_config('smoch.internal', 'off', true);

alter table public.reviews alter column body set not null;
alter table public.reviews add constraint reviews_body_check
  check (char_length(btrim(body)) between 10 and 5000);

-- Same rules as before; only the moderated text changed (no title).
create or replace function public.reviews_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  recent int;
  reason text;
  company_status text;
begin
  if public.is_internal() then
    return new;
  end if;

  if public.is_admin() then
    if tg_op = 'INSERT' and new.user_id is null then
      new.source := 'staff';
      new.added_by := auth.uid();
    end if;
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'login required' using errcode = '42501';
  end if;
  if public.is_banned() then
    raise exception 'account suspended' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if (public.setting('require_phone_for_reviews'))::boolean and not public.phone_verified() then
      raise exception 'phone_required' using errcode = 'P0001';
    end if;

    select status into company_status from public.companies where id = new.company_id;
    if company_status is distinct from 'published' then
      raise exception 'company not open for reviews' using errcode = 'P0001';
    end if;

    select count(*) into recent from public.reviews
      where user_id = auth.uid() and created_at > now() - interval '24 hours';
    if recent >= coalesce((public.setting('reviews_per_day'))::int, 3) then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;

    new.user_id := auth.uid();
    new.author_name := (select display_name from public.profiles where id = auth.uid());
    new.verified_purchase := false;
    new.helpful_count := 0;
    new.source := 'user';
    new.added_by := null;
    new.created_at := now();
    new.edited_at := null;
  else
    -- Owners may edit content only.
    new.id := old.id;
    new.company_id := old.company_id;
    new.user_id := old.user_id;
    new.author_name := old.author_name;
    new.verified_purchase := old.verified_purchase;
    new.helpful_count := old.helpful_count;
    new.source := old.source;
    new.added_by := old.added_by;
    new.created_at := old.created_at;
    new.edited_at := now();
    if old.status in ('hidden', 'rejected') then
      -- Editing never brings back a review that a moderator removed.
      new.status := old.status;
      new.moderation_note := old.moderation_note;
      return new;
    end if;
  end if;

  if not new.paid then
    new.amount_paid := null;
  end if;

  reason := public.moderation_reason(new.body);
  if reason is not null then
    new.status := 'pending';
    new.moderation_note := reason;
  elsif not coalesce((public.setting('auto_publish_reviews'))::boolean, true) then
    new.status := 'pending';
    new.moderation_note := 'ממתין לאישור ידני';
  else
    new.status := 'published';
    new.moderation_note := null;
  end if;
  return new;
end $$;

-- Recreate the stats view in its original shape (an earlier version of this
-- file added a text_count column that is no longer needed).
drop view if exists public.company_stats;
create view public.company_stats with (security_invoker = true) as
with weighted as (
  select
    r.company_id,
    r.rating,
    (case when r.verified_purchase then 1.5 else 1.0 end)
      * (case
           when r.created_at > now() - interval '1 year' then 1.0
           when r.created_at > now() - interval '2 years' then 0.75
           else 0.5
         end) as w
  from public.reviews r
  where r.status = 'published'
)
select
  c.id as company_id,
  count(w.rating)::int as review_count,
  count(*) filter (where w.rating = 1)::int as r1,
  count(*) filter (where w.rating = 2)::int as r2,
  count(*) filter (where w.rating = 3)::int as r3,
  count(*) filter (where w.rating = 4)::int as r4,
  count(*) filter (where w.rating = 5)::int as r5,
  coalesce(avg(w.rating), 0)::float8 as raw_average,
  ((3.0 * 10 + coalesce(sum(w.w * w.rating), 0)) / (10 + coalesce(sum(w.w), 0)))::float8 as trust_score
from public.companies c
left join weighted w on w.company_id = c.id
group by c.id;

grant select on public.company_stats to anon, authenticated;

commit;
