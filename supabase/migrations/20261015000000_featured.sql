-- Companies the admin picks for the home page ("חברות נבחרות"). Picking a
-- company never touches its ratings: the card shows the real score.
-- Every pick is labelled "ממומן" by default; the admin can turn the label off.
-- Safe to run more than once.

begin;

create table if not exists public.featured_companies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies (id) on delete cascade,
  position int not null default 100,
  sponsored boolean not null default true,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists featured_companies_position_idx on public.featured_companies (position);

alter table public.featured_companies enable row level security;

drop policy if exists "featured companies are public" on public.featured_companies;
drop policy if exists "admins manage featured companies" on public.featured_companies;
create policy "featured companies are public" on public.featured_companies for select using (true);
create policy "admins manage featured companies" on public.featured_companies for all
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists featured_companies_audit on public.featured_companies;
create trigger featured_companies_audit after insert or update or delete on public.featured_companies
  for each row execute function public.audit_admin_change();

commit;
