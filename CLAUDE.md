# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Shadcn/Radix UI · TypeScript · Supabase · pnpm

## Commands *(run from `frontend/`)*

```bash
pnpm dev     # localhost:3000
pnpm build   # ignoreBuildErrors: true
pnpm lint
```

## Directory Conventions

- `@/*` → `frontend/` root
- New components → `components/govern/` only
- Routing → `app/` only, never `pages/`
- Supabase client → `lib/supabase.ts` only
- Auth state → `lib/auth-context.tsx` only

## Hard Rules

- Never instantiate Supabase client outside `lib/supabase.ts`
- Never manage auth state outside `lib/auth-context.tsx`
- All new components in `components/govern/` only
- App Router only — never `pages/`
- Never touch Gate or Monitoring files

## Collaborator Boundaries

- **GATE** (FastAPI governance backend) — DO NOT TOUCH
- **MONITORING** — DO NOT TOUCH
- **AGENTS** — active module, my responsibility

If any task requires modifying Gate or Monitoring, stop immediately and flag it.
