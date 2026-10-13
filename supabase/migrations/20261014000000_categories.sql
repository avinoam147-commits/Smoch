-- Categories move from a fixed list in code to a table that admins manage
-- from the panel, so the site can grow into new kinds of services.
-- Safe to run more than once.

begin;

create table if not exists public.categories (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 40),
  label text not null check (char_length(btrim(label)) between 2 and 60),
  description text not null default '' check (char_length(description) <= 200),
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

insert into public.categories (id, label, description, sort_order) values
  ('courses', 'קורסי מסחר', 'קורסים מוקלטים ופרונטליים למסחר במניות, מט״ח וקריפטו', 10),
  ('signals', 'קבוצות איתותים', 'קבוצות בתשלום ששולחות המלצות קנייה ומכירה', 20),
  ('mentoring', 'ליווי אישי למסחר', 'מנטורים וליווי צמוד לסוחרים', 30),
  ('algo', 'בוטים ואלגו-טריידינג', 'תוכנות ובוטים למסחר אוטומטי', 40),
  ('brokers', 'ברוקרים ופלטפורמות מסחר', 'חשבונות מסחר, בתי השקעות ואפליקציות מסחר', 50),
  ('investments', 'ייעוץ והשקעות', 'ייעוץ פיננסי, ניהול תיקים ומוצרי השקעה', 60),
  ('real-estate', 'נדל״ן והשקעות נדל״ן', 'יזמים, קורסי נדל״ן וליווי השקעות בנכסים', 70),
  ('education', 'קורסים והכשרות מקצועיות', 'לימודים והכשרות שאינם בתחום המסחר', 80),
  ('business-coaching', 'ייעוץ עסקי ואימון', 'יועצים עסקיים, מאמנים ותוכניות האצה', 90),
  ('digital-marketing', 'שיווק דיגיטלי', 'סוכנויות שיווק, קידום ממומן ורשתות חברתיות', 100),
  ('online-shops', 'חנויות אונליין', 'אתרי מכירות ומשלוחים', 110),
  ('tech-services', 'בניית אתרים ותוכנה', 'בניית אתרים, אפליקציות ופיתוח תוכנה', 120),
  ('home-services', 'שירותי בית ושיפוצים', 'שיפוצים, הובלות, אינסטלציה ואחזקה', 130),
  ('other', 'אחר', 'שירותים שעדיין אין להם קטגוריה', 1000)
on conflict (id) do nothing;

-- Companies now point at the table instead of a fixed check.
alter table public.companies drop constraint if exists companies_category_check;
alter table public.companies drop constraint if exists companies_category_fkey;
alter table public.companies add constraint companies_category_fkey
  foreign key (category) references public.categories (id) on update cascade on delete restrict;
create index if not exists companies_category_idx on public.companies (category);

alter table public.categories enable row level security;

drop policy if exists "categories are public" on public.categories;
drop policy if exists "admins manage categories" on public.categories;
create policy "categories are public" on public.categories for select using (true);
create policy "admins manage categories" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists categories_audit on public.categories;
create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function public.audit_admin_change();

commit;
