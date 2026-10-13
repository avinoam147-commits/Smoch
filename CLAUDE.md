# Smoch (סמוך)

Hebrew RTL review site (Next.js 16 + Supabase). Talk to the owner in Hebrew.

## Before launch: remind the owner

When the owner talks about launching, moving to a new domain, or inviting
users, go through `LAUNCH_CHECKLIST.md` with them first. They asked to be
reminded in particular to:

1. Open an email address on the new domain (and use it in the legal pages,
   Google OAuth branding and as the email sender).
2. Test phone (SMS) verification end to end before launch.

## Database changes

Production migrations are run by hand in the Supabase SQL Editor. When a
change adds a file under `supabase/migrations/`, say so at the very top of
the message, before anything else, and ask the owner to run it before
(or right after) the deploy. Keep migrations safe to run more than once.

See `AGENTS.md` for Next.js version notes and `SETUP.md` for the setup guide.
