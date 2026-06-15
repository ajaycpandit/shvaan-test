# Shvaan Pet Care — Backend Setup Guide

This covers the Supabase/configuration steps for the four upgrades. The app code is already done; these are the dashboard steps only you can do.

---

## 1. Authentication (per-staff logins)

The app now shows a sign-in screen and only loads after a successful login. You create staff accounts in Supabase.

### Turn on email/password auth
1. Supabase dashboard → **Authentication → Providers → Email**. Make sure **Email** is enabled.
2. For staff-only internal use, turn **OFF** "Confirm email" (Authentication → Providers → Email → uncheck "Confirm email"), so accounts work immediately without an email-verification step. (Optional, but simpler for staff.)
3. Optionally turn **OFF** "Allow new users to sign up" (Authentication → Settings) so only you can create accounts.

### Create staff accounts
1. Authentication → **Users → Add user → Create new user**.
2. Enter each staff member's email + a password. Repeat per person.
3. They sign in with those credentials on the app's login screen.

### Lock the data down (IMPORTANT — do this once auth works)
Right now your tables use public read/write policies. To require login, run this in **SQL Editor** to replace the public policies with authenticated-only ones:

```sql
-- DOGS
drop policy if exists "public" on dogs;
drop policy if exists "Public read/write dogs" on dogs;
create policy "auth read/write dogs" on dogs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- BOOKINGS
drop policy if exists "public" on bookings;
drop policy if exists "Public read/write bookings" on bookings;
create policy "auth read/write bookings" on bookings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- SETTINGS
drop policy if exists "public" on settings;
create policy "auth read/write settings" on settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- VISIT NOTES
drop policy if exists "public" on visit_notes;
create policy "auth read/write visit_notes" on visit_notes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
```

> ⚠️ Do NOT lock down the `requests` table the same way yet — the public booking form (feature 3) needs to insert into it without a login. See feature 3 below for its specific policy.

---

## 2. Payment Tracking

Add the payment columns to the bookings table. Run in **SQL Editor**:

```sql
alter table bookings add column if not exists paid boolean default false;
alter table bookings add column if not exists payment_method text;
alter table bookings add column if not exists paid_at date;
```

That's it. In the app: History now shows a Paid/Unpaid badge and a **Mark Paid** button (choose Cash / Card / Venmo-Zelle / Other), and the Finance tab shows **Total Billed / Collected / Outstanding**.

---

## 3. Public Self-Booking Form (`book.html`)

`book.html` is a separate page customers use to request a booking. It writes a `pending` request to your `requests` table.

### Add the columns it uses
```sql
alter table requests add column if not exists source text;
```

### Allow public (anonymous) inserts, but keep reads private
Run in **SQL Editor**:

```sql
-- Let anyone INSERT a request (so the public form works)...
drop policy if exists "public" on requests;
create policy "public can insert requests" on requests for insert
  with check (true);

-- ...but only logged-in staff can READ / UPDATE / DELETE them
create policy "auth read requests" on requests for select
  using (auth.role() = 'authenticated');
create policy "auth update requests" on requests for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth delete requests" on requests for delete
  using (auth.role() = 'authenticated');
```

### Publish it
Drop `book.html` into the same GitHub repo as the main app. It will be reachable at:
`https://yourusername.github.io/yourrepo/book.html`

Share that link with customers (website button, QR code, etc). Public requests show up in your Reservations tab marked as coming from the public form.

---

## 4. Automated Vaccination Reminder Emails

A static web page can't send scheduled email, so this uses a Supabase **Edge Function** + **Resend** (free tier ~3,000 emails/month). The function file is `vaccination-reminder-function.ts`.

### Step A — Resend account
1. Sign up at **resend.com** (free).
2. Verify a sending domain (or use their test `onboarding@resend.dev` to start).
3. Create an **API key** → copy it.

### Step B — Install the Supabase CLI (one time, on your computer)
```bash
npm install -g supabase
supabase login
supabase link --project-ref xtvyyszobucmaktpulxt
```

### Step C — Create & deploy the function
```bash
supabase functions new vaccination-reminders
# replace the generated index.ts with the contents of vaccination-reminder-function.ts
supabase functions deploy vaccination-reminders --no-verify-jwt
```

### Step D — Set the secrets
Supabase dashboard → **Edge Functions → Secrets** (or via CLI):
```bash
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set FROM_EMAIL="Shvaan Pet Care <reminders@yourdomain.com>"
supabase secrets set SUPABASE_SERVICE_ROLE=your_service_role_key
```
(`SUPABASE_URL` is provided automatically.)

### Step E — Schedule it daily
Supabase dashboard → **Database → Cron Jobs** (or the `pg_cron` + `pg_net` extensions), schedule a daily call to the function URL, e.g. every day at 8am:
```sql
select cron.schedule(
  'daily-vacc-reminders',
  '0 8 * * *',
  $$ select net.http_post(
       url:='https://xtvyyszobucmaktpulxt.functions.supabase.co/vaccination-reminders',
       headers:='{"Authorization":"Bearer YOUR_ANON_OR_SERVICE_KEY"}'::jsonb
     ); $$
);
```

### Meanwhile — instant manual reminders (no setup)
The main app already has **✉️ Email reminder** buttons (in the notification bell and on the dog's vaccination alerts) that open a pre-written email to the owner. These work right now with zero setup — the Edge Function just automates the same thing on a schedule.

---

## Quick recap of what needs doing

| Feature | Your action |
|---|---|
| Auth | Enable email auth, add staff users, run the RLS lockdown SQL |
| Payments | Run the 3 `alter table bookings` lines |
| Public form | Run the `requests` policy SQL, publish `book.html` |
| Auto emails | Resend account + deploy Edge Function + cron (or just use the in-app buttons) |
