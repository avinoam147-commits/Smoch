-- Removes the sample companies and everything attached to them
-- (reviews, replies, home page picks). Real companies are not touched.

begin;

delete from public.companies where slug like 'demo-%';

commit;
