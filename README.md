# Smart Bookmark App

A real-time bookmark manager built with Next.js (App Router), Supabase, and Tailwind CSS.

Live URL: _[your Vercel deployment URL]_

## Features

- Google OAuth sign-in (no email/password)
- Add bookmarks with URL and title
- Bookmarks are private per user (RLS enforced)
- Real-time sync across tabs and devices via Supabase Realtime
- Delete bookmarks with confirmation dialog
- Deployed on Vercel

## Tech Stack

- **Next.js 15** — App Router, server components, route handlers
- **Supabase** — Auth (Google OAuth + PKCE), PostgreSQL database, Realtime subscriptions
- **Tailwind CSS** — utility-first styling
- **@supabase/ssr** — cookie-based auth for both client and server

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main dashboard (bookmarks CRUD + realtime)
│   ├── signin/page.tsx     # Google OAuth sign-in page
│   └── auth/callback/route.ts  # OAuth callback (code → session exchange)
├── components/ui/          # Reusable UI components (Button, Avatar, AlertDialog)
├── types/bookmark.ts       # Shared TypeScript types
└── utils/db.ts             # Supabase browser client singleton
```

## Setup

1. Clone the repo
2. `npm install`
3. Create a `.env.local` with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. In Supabase dashboard:
   - Enable Google OAuth provider under Authentication → Providers
   - Add your redirect URL: `https://your-domain.vercel.app/auth/callback`
   - Create the `bookmarks` table with RLS policies (see below)
5. `npm run dev`

### Bookmarks Table

```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  title text not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now()
);

alter table bookmarks enable row level security;

create policy "Users can read own bookmarks"
  on bookmarks for select using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on bookmarks for delete using (auth.uid() = user_id);
```

Also enable Realtime on the `bookmarks` table in Supabase dashboard → Database → Replication.

## Problems Encountered and Solutions

### 1. OAuth Callback Not Exchanging Code for Session

**Problem:** After Google sign-in, the callback route received the authorization code but the session exchange silently failed because the PKCE `code_verifier` cookie wasn't being read correctly.

**Solution:** Used `@supabase/ssr`'s `createServerClient` in the route handler with proper `getAll`/`setAll` cookie methods so the code verifier is read and the session tokens are written back correctly.

### 2. Home Page Not Detecting Auth State After Redirect

**Problem:** After a successful OAuth flow and redirect to `/`, the home page showed the sign-in state because it wasn't checking for an existing Supabase session on mount.

**Solution:** Added `supabaseClient.auth.getSession()` in a `useEffect` on the home page to hydrate the user state on load, plus `onAuthStateChange` to keep it in sync.

### 3. React Hook Called Conditionally

**Problem:** `useRouter()` was placed after an early `return` statement (the loading spinner), which violates React's Rules of Hooks — hooks must be called in the same order every render.

**Solution:** Moved `useRouter()` to the top of the component, before any conditional returns.

### 4. Wrong Router Import for App Router

**Problem:** Imported `useRouter` from `next/router` (Pages Router API), which doesn't work in the App Router.

**Solution:** Changed the import to `next/navigation`.

### 5. Bookmarks Visible Across Users

**Problem:** Without Row Level Security, any authenticated user could see all bookmarks in the table.

**Solution:** Enabled RLS on the `bookmarks` table and added per-user policies for SELECT, INSERT, and DELETE based on `auth.uid() = user_id`.

## Deployment

```bash
vercel --prod
```

Environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) must be set in Vercel project settings.
