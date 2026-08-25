# Web-TanStack AI Contributor Guidelines

`apps/web-tanstack` is the **in-progress migration** of the web app from Next.js to TanStack Router + Vite (#7994). It is a second runtime for the same code — not a fork.

## The one rule that matters

This app **reuses `apps/web/src` verbatim** via aliases in `vite.config.ts`. Feature, component, and store changes belong in `apps/web/src` — they serve both runtimes. Only routing, build, and compat-shim code lives here. **Never copy a shared file into this app to modify it.**

## Layout

- `src/routes/` — TanStack Router file-based routes (this app's counterpart to `apps/web/src/pages`)
- `src/compat/` — shims that satisfy `next/*` imports from shared code (`next-router`, `next-link`, `next-image`, `next-dynamic`, …). If shared code needs a Next.js API a shim lacks, extend the shim — don't rewrite shared code around it.
- `vite.config.ts` — alias order matters; it also re-injects `NEXT_PUBLIC_*` env vars so reused code and `packages/*` keep reading them, mirroring `apps/web/next.config.mjs`.

## Commands

`yarn workspace @safe-global/web-tanstack dev` — root `yarn verify:changed` does NOT cover this app; run `node scripts/verify.mjs --changed --workspace=web-tanstack`.

## Build specifics

The build wires a service-worker plugin and an import-map integrity plugin (`scripts/assert-sri.mjs`) — preserve both when touching build config.
