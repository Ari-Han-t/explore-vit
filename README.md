# Explore VIT

Explore VIT helps VIT students explore domains, connect with mentors, reflect on what they are learning, and get direction based on their activity.

## What It Includes

- Student sign-in with Google OAuth
- Mentor sign-in and signup with email/password
- Mentor discovery with real mentor profiles from Supabase
- Student reflections and interest tracking
- Realtime chat between students and mentors
- A FastAPI recommendation service for domain guidance

## Stack

- Frontend: Next.js 16, TypeScript, Tailwind CSS
- Backend: FastAPI
- Database/Auth/Realtime: Supabase
- ML: scikit-learn TF-IDF similarity

## Project Structure

```text
app/          Next.js routes
components/   Shared UI and auth provider
lib/          Supabase helpers, types, local utilities
backend/      FastAPI app and ML recommender
supabase/     SQL schema and seed files
public/       Static assets
```

## Local Setup

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Add frontend env vars

Create `.env.local` in the repo root:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_ALLOWED_STUDENT_DOMAIN=vitstudent.ac.in
```

Optional legacy fallback:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 3. Add backend env vars

Create `backend/.env`:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Optional legacy fallback:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

### 4. Run the frontend

```bash
npm run dev
```

### 5. Run the backend

Use Python 3.13 on Windows:

```bash
py -3.13 -m venv .venv
source .venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

## Supabase Setup

### Run the SQL files

In Supabase SQL Editor, run:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

### Configure auth

In Supabase Dashboard:

1. Enable Google under `Authentication -> Providers`
2. Set `Authentication -> Hooks -> Before User Created` to `public.hook_control_signup`
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - your production callback URL

### Student access rule

Students must sign in with Google using an allowed VIT student domain from `public.allowed_student_email_domains`.

### Mentor access rule

Mentors sign up with email/password. Their email must exist in `public.allowed_mentor_emails`.

## Mentor Signup And Manual Enable

Mentors can sign up directly from `/login` using the `Sign up as Mentor` button.

If you need to manually promote an existing Supabase auth user to mentor, run:

```sql
select public.enable_mentor_by_user_id(
  'USER_UUID_HERE',
  'Mentor Name',
  'Mentor bio',
  array['Specialisation 1', 'Specialisation 2']
);
```

To find the user ID:

```sql
select id, email
from auth.users
order by created_at desc;
```

## Final Checks Before Deploy

### App checks

- `npm run lint`
- `npm run build`
- `py -3.13 -m py_compile backend\main.py backend\ml\domain_profiles.py backend\ml\recommender.py`

### Product checks

- Student Google login works
- Mentor signup works for allowlisted mentor emails
- Mentor profile appears in the mentor list
- Student can save profile info and reflections
- Mentor can see student context after a session starts
- Realtime chat works in both directions

## Deployment

- Frontend: Vercel
- Backend: Railway
- Database/Auth/Realtime: Supabase

Add the same environment variables in production and update Supabase redirect URLs to include your deployed frontend domain.
