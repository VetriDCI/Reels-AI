# Admin Login Setup

The project now has:
- `/admin/login` — separate admin login
- `/admin` — protected admin dashboard
- `Admin Login` link on the normal `/login` page
- `profiles.role` with `user` / `admin`

## Supabase
1. Run the updated `supabase/schema.sql`.
2. Create the admin account in Supabase Authentication.
3. Promote that account:
```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where lower(email) = lower('YOUR_ADMIN_EMAIL')
);
```
4. In Render, keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Optional: set `VITE_ADMIN_EMAIL` to the same admin email and redeploy.

## URLs
- User login: `/login`
- Admin login: `/admin/login`
- Admin dashboard: `/admin`

Do not put a Supabase service-role key in Vite/Render frontend environment variables.
