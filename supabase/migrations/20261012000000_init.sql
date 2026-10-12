-- Smoch: initial schema.
--
-- Principles:
--   * Every rule that matters (one review per user per company, rate limits, moderation,
--     who may set "verified purchase") is enforced here, not only in the UI, because
--     anyone can call the REST API directly with the public key.
--   * Admin changes are written to admin_audit automatically by triggers.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create extension if not exists pg_trgm with schema extensions;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Internal writes (vote counters, receipt approval) set this flag so the
-- guard triggers don't treat them as a user edit.
create or replace function public.is_internal()
returns boolean language sql stable as $$
  select coalesce(current_setting('smoch.internal', true), '') = 'on'
$$;

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value, description) values
  ('require_phone_for_reviews', 'false', 'לחייב אימות טלפון לפני כתיבת ביקורת'),
  ('auto_publish_reviews', 'true', 'לפרסם ביקורות שעברו את הבדיקה האוטומטית בלי אישור ידני'),
  ('reviews_per_day', '3', 'מספר ביקורות מקסימלי למשתמש ב-24 שעות'),
  ('companies_per_day', '5', 'מספר חברות מקסימלי שמשתמש יכול להציע ב-24 שעות');

create or replace function public.setting(k text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select value from public.app_settings where key = k
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'משתמש/ת' check (char_length(display_name) between 2 and 40),
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_banned boolean not null default false,
  notify_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- "דנה כהן" -> "דנה כ."  We only ever show first name + last initial.
create or replace function public.make_display_name(full_name text)
returns text language plpgsql immutable as $$
declare
  parts text[];
begin
  parts := regexp_split_to_array(btrim(coalesce(full_name, '')), '\s+');
  if array_length(parts, 1) is null or parts[1] = '' then
    return 'משתמש/ת';
  elsif array_length(parts, 1) = 1 then
    return left(parts[1], 40);
  else
    return left(parts[1] || ' ' || left(parts[array_length(parts, 1)], 1) || '.', 40);
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    public.make_display_name(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- True for the service (secret) key and for direct database sessions such as
-- the Supabase SQL editor, i.e. the site owner rather than an end user.
create or replace function public.is_service()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      or coalesce(current_setting('request.jwt.claims', true), '') in ('', '{}')
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_service()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function public.is_banned()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select is_banned from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.phone_verified()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select phone_confirmed_at is not null from auth.users where id = auth.uid()), false)
$$;

-- Users may change their display name and email preference, nothing else.
create or replace function public.profiles_guard()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_banned := old.is_banned;
    new.id := old.id;
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  category text not null check (category in ('courses', 'signals', 'mentoring', 'algo')),
  tagline text not null default '' check (char_length(tagline) <= 160),
  about text not null default '' check (char_length(about) <= 3000),
  website text check (char_length(website) <= 200),
  social_url text check (char_length(social_url) <= 300),
  logo_url text,
  registry_id text check (char_length(registry_id) <= 30),
  registry_verified boolean not null default false,
  registry_data jsonb,
  city text check (char_length(city) <= 60),
  founded int check (founded between 1948 and 2100),
  price_range text check (char_length(price_range) <= 80),
  claimed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  admin_note text,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index companies_registry_unique on public.companies (registry_id)
  where registry_id is not null and status <> 'rejected';
create index companies_status_idx on public.companies (status);
create index companies_name_trgm on public.companies using gin (name extensions.gin_trgm_ops);

create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

create or replace function public.companies_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  recent int;
begin
  if public.is_admin() or public.is_internal() then
    if tg_op = 'INSERT' and new.created_by is null then
      new.created_by := auth.uid();
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is null then
      raise exception 'login required' using errcode = '42501';
    end if;
    if public.is_banned() then
      raise exception 'account suspended' using errcode = '42501';
    end if;
    select count(*) into recent from public.companies
      where created_by = auth.uid() and created_at > now() - interval '24 hours';
    if recent >= coalesce((public.setting('companies_per_day'))::int, 5) then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
    new.status := 'pending';
    new.registry_verified := false;
    new.registry_data := null;
    new.claimed := false;
    new.admin_note := null;
    new.logo_url := null;
    new.created_by := auth.uid();
  end if;
  return new;
end $$;

create trigger companies_guard before insert or update on public.companies
  for each row execute function public.companies_guard();

-- ---------------------------------------------------------------------------
-- Company members (verified representatives who may reply)
-- ---------------------------------------------------------------------------

create table public.company_members (
  company_id uuid not null references public.companies on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create or replace function public.is_company_member(cid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.company_members where company_id = cid and user_id = auth.uid())
$$;

create or replace function public.sync_company_claimed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := coalesce(new.company_id, old.company_id);
begin
  perform set_config('smoch.internal', 'on', true);
  update public.companies
     set claimed = exists (select 1 from public.company_members where company_id = cid)
   where id = cid;
  perform set_config('smoch.internal', 'off', true);
  return null;
end $$;

create trigger company_members_claimed after insert or delete on public.company_members
  for each row execute function public.sync_company_claimed();

-- ---------------------------------------------------------------------------
-- Company claims (a representative asks to manage the page)
-- ---------------------------------------------------------------------------

create table public.company_claims (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  full_name text not null check (char_length(full_name) between 2 and 80),
  job_title text not null check (char_length(job_title) between 2 and 80),
  work_email text not null check (work_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 30),
  message text check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create unique index company_claims_one_pending on public.company_claims (company_id, user_id)
  where status = 'pending';

create or replace function public.company_claims_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and not public.is_admin() then
    if public.is_banned() then
      raise exception 'account suspended' using errcode = '42501';
    end if;
    new.user_id := auth.uid();
    new.status := 'pending';
    new.admin_note := null;
    new.decided_at := null;
  end if;
  if tg_op = 'UPDATE' and new.status <> old.status then
    new.decided_at := now();
    if new.status = 'approved' then
      insert into public.company_members (company_id, user_id)
      values (new.company_id, new.user_id) on conflict do nothing;
    end if;
  end if;
  return new;
end $$;

create trigger company_claims_guard before insert or update on public.company_claims
  for each row execute function public.company_claims_guard();

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  user_id uuid references auth.users on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 40),
  rating smallint not null check (rating between 1 and 5),
  title text not null check (char_length(btrim(title)) between 4 and 120),
  body text not null check (char_length(btrim(body)) between 80 and 5000),
  paid boolean not null default true,
  amount_paid int check (amount_paid between 0 and 1000000),
  experience_date date,
  verified_purchase boolean not null default false,
  -- 'user' = written by a signed-in user. 'staff' = added by an admin
  -- (e.g. imported with permission); always labelled publicly.
  source text not null default 'user' check (source in ('user', 'staff')),
  added_by uuid references auth.users on delete set null,
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden', 'rejected')),
  moderation_note text,
  helpful_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz
);

create unique index reviews_one_per_user on public.reviews (company_id, user_id) where user_id is not null;
create index reviews_company_status_idx on public.reviews (company_id, status, created_at desc);
create index reviews_status_created_idx on public.reviews (status, created_at desc);
create index reviews_user_idx on public.reviews (user_id);

create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- Automatic screening. Returns null when clean, otherwise the reason the
-- review is held for a human. Kept deliberately simple and transparent;
-- the same lists live in src/lib/moderation.ts to warn the writer early.
create or replace function public.moderation_reason(t text)
returns text language plpgsql immutable as $$
declare
  s text := lower(coalesce(t, ''));
begin
  if s ~ '(\+?972[\s-]?|\m0)(5\d|[2-489]|7\d)[\s-]?\d{3}[\s-]?\d{4}' then
    return 'מכיל מספר טלפון';
  end if;
  if s ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then
    return 'מכיל כתובת מייל';
  end if;
  if s ~ '(https?://|www\.)' then
    return 'מכיל קישור';
  end if;
  if s ~ '(נוכל|הונא|רמאי|רמאות|גנב|גנבים|פושע|עבריין|מאפיה|עוקץ|עוקצים|סקאם|scam|fraud)' then
    return 'מכיל האשמה חמורה שדורשת בדיקה';
  end if;
  return null;
end $$;

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

  reason := public.moderation_reason(new.title || ' ' || new.body);
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

create trigger reviews_guard before insert or update on public.reviews
  for each row execute function public.reviews_guard();

-- ---------------------------------------------------------------------------
-- Company replies (one public reply per review)
-- ---------------------------------------------------------------------------

create table public.review_replies (
  review_id uuid primary key references public.reviews on delete cascade,
  company_id uuid not null references public.companies on delete cascade,
  author_id uuid references auth.users on delete set null default auth.uid(),
  body text not null check (char_length(btrim(body)) between 2 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger review_replies_updated_at before update on public.review_replies
  for each row execute function public.set_updated_at();

create or replace function public.review_replies_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.company_id := (select company_id from public.reviews where id = new.review_id);
  if not public.is_admin() then
    new.author_id := auth.uid();
    if tg_op = 'UPDATE' then
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end $$;

create trigger review_replies_guard before insert or update on public.review_replies
  for each row execute function public.review_replies_guard();

-- ---------------------------------------------------------------------------
-- Helpful votes
-- ---------------------------------------------------------------------------

create table public.review_votes (
  review_id uuid not null references public.reviews on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create or replace function public.review_votes_count()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  rid uuid := coalesce(new.review_id, old.review_id);
begin
  if tg_op = 'INSERT' and exists (select 1 from public.reviews where id = rid and user_id = new.user_id) then
    raise exception 'cannot vote on own review' using errcode = 'P0001';
  end if;
  perform set_config('smoch.internal', 'on', true);
  update public.reviews
     set helpful_count = (select count(*) from public.review_votes where review_id = rid)
   where id = rid;
  perform set_config('smoch.internal', 'off', true);
  return null;
end $$;

create trigger review_votes_count after insert or delete on public.review_votes
  for each row execute function public.review_votes_count();

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews on delete cascade,
  reporter_id uuid references auth.users on delete set null default auth.uid(),
  reason text not null check (reason in ('personal_info', 'fake', 'not_experience', 'offensive', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'dismissed', 'actioned')),
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index reports_one_per_user on public.reports (review_id, reporter_id) where reporter_id is not null;
create index reports_status_idx on public.reports (status, created_at desc);

create or replace function public.reports_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and not public.is_admin() then
    if public.is_banned() then
      raise exception 'account suspended' using errcode = '42501';
    end if;
    new.reporter_id := auth.uid();
    new.status := 'open';
    new.resolution_note := null;
    new.resolved_at := null;
  end if;
  if tg_op = 'UPDATE' and new.status <> old.status and new.status <> 'open' then
    new.resolved_at := now();
  end if;
  return new;
end $$;

create trigger reports_guard before insert or update on public.reports
  for each row execute function public.reports_guard();

-- ---------------------------------------------------------------------------
-- Receipts (proof of purchase, private, deleted after review)
-- ---------------------------------------------------------------------------

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  file_deleted_at timestamptz
);

create unique index receipts_one_pending on public.receipts (review_id) where status = 'pending';

create or replace function public.receipts_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and not public.is_admin() then
    new.user_id := auth.uid();
    new.status := 'pending';
    new.admin_note := null;
    if not exists (select 1 from public.reviews where id = new.review_id and user_id = auth.uid()) then
      raise exception 'not your review' using errcode = '42501';
    end if;
    if new.storage_path is null or split_part(new.storage_path, '/', 1) <> auth.uid()::text then
      raise exception 'invalid path' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.status <> old.status then
    new.decided_at := now();
    perform set_config('smoch.internal', 'on', true);
    update public.reviews set verified_purchase = (new.status = 'approved') where id = new.review_id;
    perform set_config('smoch.internal', 'off', true);
  end if;
  return new;
end $$;

create trigger receipts_guard before insert or update on public.receipts
  for each row execute function public.receipts_guard();

-- ---------------------------------------------------------------------------
-- Stats view: trust score
-- ---------------------------------------------------------------------------
-- Bayesian average: every company starts with PRIOR_WEIGHT imaginary 3-star
-- reviews. Verified purchases weigh 1.5x; reviews older than a year weigh less.

create or replace view public.company_stats with (security_invoker = true) as
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

-- ---------------------------------------------------------------------------
-- Audit log (admin actions)
-- ---------------------------------------------------------------------------

create table public.admin_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_created_idx on public.admin_audit (created_at desc);

create or replace function public.audit_admin_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  rec_id text;
begin
  if public.is_internal() or not public.is_admin() then
    return null;
  end if;
  -- New sign-ups create a profile through the auth trigger; that isn't a staff action.
  if tg_table_name = 'profiles' and tg_op = 'INSERT' then
    return null;
  end if;
  rec_id := coalesce(
    to_jsonb(coalesce(new, old)) ->> 'id',
    to_jsonb(coalesce(new, old)) ->> 'review_id',
    to_jsonb(coalesce(new, old)) ->> 'key'
  );
  insert into public.admin_audit (actor_id, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    rec_id,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return null;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['companies', 'reviews', 'review_replies', 'reports', 'receipts',
                           'company_claims', 'company_members', 'profiles', 'app_settings']
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_admin_change()',
      t || '_audit', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Admin helpers
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_users(search text default null, max_rows int default 200)
returns table (
  id uuid,
  email text,
  display_name text,
  role text,
  is_banned boolean,
  phone_verified boolean,
  created_at timestamptz,
  review_count bigint
) language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.role, p.is_banned,
           u.phone_confirmed_at is not null, p.created_at,
           (select count(*) from public.reviews r where r.user_id = p.id)
      from public.profiles p
      join auth.users u on u.id = p.id
     where search is null or search = ''
        or u.email ilike '%' || search || '%'
        or p.display_name ilike '%' || search || '%'
     order by p.created_at desc
     limit max_rows;
end $$;

-- Deletes the caller's account. Reviews, votes, claims and receipts cascade.
-- The app removes receipt files from storage before calling this.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'login required' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.delete_my_account() from public, anon;
revoke execute on function public.admin_list_users(text, int) from public, anon;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.admin_list_users(text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.company_claims enable row level security;
alter table public.reviews enable row level security;
alter table public.review_replies enable row level security;
alter table public.review_votes enable row level security;
alter table public.reports enable row level security;
alter table public.receipts enable row level security;
alter table public.admin_audit enable row level security;

-- settings
create policy "settings readable" on public.app_settings for select using (true);
create policy "settings admin write" on public.app_settings for update using (public.is_admin()) with check (public.is_admin());

-- profiles
create policy "own profile or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- companies
create policy "published companies are public" on public.companies for select
  using (status = 'published' or created_by = auth.uid() or public.is_admin());
create policy "signed in users suggest companies" on public.companies for insert
  with check (auth.uid() is not null);
create policy "admins update companies" on public.companies for update
  using (public.is_admin()) with check (public.is_admin());
create policy "admins delete companies" on public.companies for delete using (public.is_admin());

-- company members
create policy "members see own membership" on public.company_members for select
  using (user_id = auth.uid() or public.is_admin());
create policy "admins manage members" on public.company_members for all
  using (public.is_admin()) with check (public.is_admin());

-- claims
create policy "own claims or admin" on public.company_claims for select using (user_id = auth.uid() or public.is_admin());
create policy "signed in users claim" on public.company_claims for insert with check (auth.uid() is not null);
create policy "admins decide claims" on public.company_claims for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete claims" on public.company_claims for delete using (public.is_admin());

-- reviews
create policy "published reviews are public" on public.reviews for select
  using (status = 'published' or user_id = auth.uid() or public.is_admin());
create policy "signed in users write reviews" on public.reviews for insert
  with check (auth.uid() is not null);
create policy "owners and admins edit reviews" on public.reviews for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "owners and admins delete reviews" on public.reviews for delete
  using (user_id = auth.uid() or public.is_admin());

-- replies
create policy "replies are public with their review" on public.review_replies for select
  using (exists (select 1 from public.reviews r where r.id = review_id));
create policy "members and admins reply" on public.review_replies for insert
  with check (public.is_admin() or public.is_company_member((select company_id from public.reviews where id = review_id)));
create policy "members and admins edit replies" on public.review_replies for update
  using (public.is_admin() or public.is_company_member(company_id))
  with check (public.is_admin() or public.is_company_member(company_id));
create policy "members and admins delete replies" on public.review_replies for delete
  using (public.is_admin() or public.is_company_member(company_id));

-- votes
create policy "own votes" on public.review_votes for select using (user_id = auth.uid());
create policy "vote as self" on public.review_votes for insert with check (user_id = auth.uid() and not public.is_banned());
create policy "unvote as self" on public.review_votes for delete using (user_id = auth.uid());

-- reports
create policy "own reports or admin" on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy "signed in users report" on public.reports for insert with check (auth.uid() is not null);
create policy "admins resolve reports" on public.reports for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete reports" on public.reports for delete using (public.is_admin());

-- receipts
create policy "own receipts or admin" on public.receipts for select using (user_id = auth.uid() or public.is_admin());
create policy "upload own receipt" on public.receipts for insert with check (auth.uid() is not null);
create policy "admins decide receipts" on public.receipts for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete receipts" on public.receipts for delete using (public.is_admin());

-- audit
create policy "admins read audit" on public.admin_audit for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
  ('logos', 'logos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "upload own receipts" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read own receipts or admin" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "delete own receipts or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "logos are public" on storage.objects for select using (bucket_id = 'logos');
create policy "admins manage logos" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.is_admin());
create policy "admins update logos" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and public.is_admin());
create policy "admins delete logos" on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and public.is_admin());
