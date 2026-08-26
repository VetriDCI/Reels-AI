# Reels RA — Setup & Demo Login Guide

## 1. Create a Supabase project
1. Go to https://supabase.com → New project.
2. Wait for it to finish provisioning, then open **Project Settings → API**.
3. Copy the **Project URL** and **anon public key**.

## 2. Configure environment variables
Copy `.env.example` to `.env` and fill in the two values from step 1:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 3. Run the database migrations
In Supabase Dashboard → **SQL Editor → New query**, run these two files **in order**:

1. `supabase/schema.sql` — creates `profiles`, `reels`, `reel_likes`, `reel_comments`,
   `follows` tables, Row Level Security policies, the auto-profile-creation trigger,
   and the `reel-media` storage bucket.
2. `supabase/feed-migration.sql` — adds like/comment counters and the comment-delete policy.

(Previously only `feed-migration.sql` was included in this package — `schema.sql` is
new and is why login/signup/feed weren't working before.)

## 4. Install and run
```
npm install
npm run dev
```

## 5. Create a demo login
Easiest way — sign up through the app itself:

1. Open the app → **Create account**.
2. Username: `demo`
3. Email: `demo@reelsra.app`
4. Password: `Demo@12345`

By default Supabase requires email confirmation before the account can log in.
Since there's no email service connected yet, confirm it manually:

- **Dashboard way:** Authentication → Users → find `demo@reelsra.app` → the "..." menu → **Confirm email**.
- **Or SQL way** (SQL Editor):
  ```sql
  update auth.users set email_confirmed_at = now()
  where email = 'demo@reelsra.app';
  ```

Then log in with:
- Email: `demo@reelsra.app`
- Password: `Demo@12345`

(Alternatively, turn off "Confirm email" under Authentication → Providers → Email
while testing, so every new signup logs in immediately.)

## 6. What each screen needs to work
- **Login / Register** — needs `schema.sql` (profiles table + auto-create trigger).
- **Forgot / Reset password** — needs email sending configured in Supabase
  (Authentication → Email templates) to actually receive the link; the reset flow
  itself is fully wired up in code.
- **Feed** — needs `reels` table + at least one published reel (upload one after
  logging in, or insert a test row directly in the table).
- **Upload** — needs the `reel-media` storage bucket (created by `schema.sql`).
- **Search** — needs the `profiles` table populated (created automatically as
  people sign up).
- **Profile** — needs the signed-in user's `profiles` row (auto-created on signup).

## Fixes made in this package
- Added missing `supabase/schema.sql` (base tables + RLS + storage bucket + auto
  profile-creation trigger) — this was referenced in docs but not included.
- Forgot Password / Reset Password pages were placeholder text only — now they
  actually call Supabase to send a reset email and update the password.
- Register page crashed if Supabase env vars were missing — now shows a clean error.
- Profile page didn't reload your name/bio into the edit form if the profile
  loaded a moment after the page rendered — fixed.
- Search page could throw an unhandled error on failed search — now shows a
  message instead.
- `index.html` was missing `<!doctype html>`, `<head>`, and the mobile viewport
  meta tag — fixed (matters for how it looks on phones).
- Added the missing `.form-alert` / `.error-alert` / `.success-alert` CSS classes
  that Upload/Profile/Search pages referenced but weren't styled.
