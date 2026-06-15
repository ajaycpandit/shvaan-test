-- ════════════════════════════════════════════════════════════
-- Shvaan Pet Care — Roles & Profiles setup
-- Run this in Supabase → SQL Editor BEFORE using the roles feature.
-- ════════════════════════════════════════════════════════════

-- 1) Profiles table: assigns each login a role + permissions.
--    Keyed by email (lowercased) so the admin can manage people by email.
create table if not exists profiles (
  email        text primary key,        -- lowercased email, matches the Supabase Auth login
  role         text not null default 'staff',  -- 'admin' | 'staff' | 'customer'
  permissions  jsonb default '{}'::jsonb,       -- e.g. {"finance":false,"settings":false,"dogs":true,...}
  owner_name   text,                     -- for customers: must match their dogs' owner_name
  created_at   timestamptz default now()
);

alter table profiles enable row level security;

-- While you are still building/testing (RLS NOT yet locked down elsewhere),
-- use a permissive policy so the app can read/write profiles:
create policy "open profiles" on profiles for all using (true) with check (true);

-- 2) Add the columns the customer booking form / payments use, if not already present:
alter table requests add column if not exists source text;
alter table bookings add column if not exists imported boolean default false;
alter table bookings add column if not exists paid boolean default false;
alter table bookings add column if not exists payment_method text;
alter table bookings add column if not exists paid_at date;

-- 3) FIRST ADMIN:
--    Until a profile exists for your email, the app treats you as admin (first-run safety).
--    Once you add ANY profiles, be sure to add YOURSELF as admin so you keep full access:
--    (replace with your real login email, lowercase)
--
--    insert into profiles (email, role) values ('you@youremail.com', 'admin');
--
--    Or just use the in-app Settings → Team & Access panel to add people
--    (it writes to this table for you).

-- ════════════════════════════════════════════════════════════
-- IMPORTANT — when you do the FINAL RLS lockdown later:
-- Replace the "open profiles" policy above with an authenticated-only one,
-- and add policies so customers can only read their own data. Ask for the
-- lockdown SQL when you're ready; it needs to be written carefully so
-- customers can't see each other's dogs/bookings.
-- ════════════════════════════════════════════════════════════
