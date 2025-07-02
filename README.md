# Inventory Next.js App

This is a rewrite of the original inventory management app using Next.js App Router and Supabase. It supports authentication, product management, sales logs and links per user. The codebase uses TypeScript and organizes logic under `app/`, `components/`, `context/` and `lib/`.

## Folder Structure

```
app/             - Next.js App Router pages
  login/         - sign in / sign up page
  products/      - product management
  dashboard/     - statistics and sales log
  links/         - useful links
components/      - reusable UI components
context/         - AuthProvider with Supabase session
lib/             - `supabaseClient.ts`
```

Important files:

- `lib/supabaseClient.ts` creates the Supabase browser client using env vars.
- `context/AuthContext.tsx` exposes session and client via React context.
- `components/Nav.tsx` renders the header with navigation and theme toggle.

## Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase project credentials.

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Development
Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

The app requires the following environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run `npm run build` to create a production build.
