# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint check
npm run preview      # Preview production build
```

There are no automated tests. Supabase Edge Functions are deployed via the Supabase CLI:
```bash
supabase functions deploy <function-name>
```

## Architecture

**MCS Client Hub** is a React + Vite SPA (single-page app) serving as a NOC/IT service portal for MCS Networks clients. It has no traditional backend — all server-side logic lives in Supabase (PostgreSQL + Auth + Edge Functions).

### Auth & Routing

The entire app routes through a single path `/` in `src/pages/Index.tsx`. The `useAuth` hook (`src/hooks/useAuth.ts`) determines what to render:
- No session → `LoginForm`
- Authenticated admin → `AdminPanel`
- Authenticated client → `ClientPortal`

Users have roles stored in the `profiles` table (`admin`, `responsable`, `visualizador`, `gerente`, etc.). The role is loaded after Supabase Auth login.

### Data Model

Four main tables in Supabase PostgreSQL:
- `profiles` — user roles and metadata (linked to `auth.users`)
- `clients` — company/client records
- `services` — service offerings per client
- `sub_services` — URLs to external tools, linked to services

RLS (Row Level Security) is enabled. Use the Supabase anon key on the frontend; the service role key is only used inside Edge Functions.

### Edge Functions (`supabase/functions/`)

Two Deno-based serverless functions:
- **`mcs-chatbot/`** — AI chatbot powered by Gemini API. Queries Halo ITSM API for ticket data to answer client questions. Uses streaming responses.
- **`manage-users/`** — Admin operations that require the service role key (create/delete users in `auth.users`).

Edge Function secrets (set via Supabase dashboard, not `.env`):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `HALO_ITSM_URL`, `HALO_ITSM_CLIENT_ID`, `HALO_ITSM_CLIENT_SECRET`

### Frontend Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://dbeeoriugpuqzqmhvjei.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=dbeeoriugpuqzqmhvjei
```

### Key Patterns

- **UI components** are all from shadcn-ui in `src/components/ui/` — prefer using/extending existing components rather than creating new ones.
- **Path alias**: `@/` maps to `src/`.
- **TypeScript** is configured with loose settings (`noImplicitAny: false`, `strictNullChecks: false`).
- **SSO links** to other MCS Vercel apps (webapp-proyectos, webapp-disponibilidad) are generated in `src/lib/auth-utils.ts`.
- **Deployment** is via Vercel (auto-deploy from main branch).
- The UI is in **Spanish** — keep all user-facing text in Spanish.
