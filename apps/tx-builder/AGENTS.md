# Tx-Builder AI Contributor Guidelines

`apps/tx-builder` is a **Safe App** (runs in an iframe inside Safe{Wallet}) for composing and batching custom contract interactions. Migrated from the separate safe-apps repo; it keeps its own stack.

## Stack divergence — root/web UI rules do NOT apply here

- **UI: MUI v6 + Emotion + styled-components.** The shadcn/Tailwind/vars.css rules from root and `apps/web` do not apply. Theme lives in `src/theme/` (MUI theme config).
- **State: React Context providers in `src/store/`** — not Redux/RTK.
- **Build: Vite.** Env vars use the `VITE_*` prefix (e.g. `VITE_TENDERLY_*`), not `NEXT_PUBLIC_*`.

## Commands

`yarn workspace @safe-global/tx-builder dev` (Vite dev server, port 4000) — plus the standard `build` / `test` / `lint` scripts.

## Testing

Unit tests are colocated. E2E coverage lives in the main web suite at `apps/web/cypress/e2e/safe-apps/` (exercises the real iframe integration).

## Safe App constraints

The app talks to the host via `safe-apps-sdk` / `safe-apps-react-sdk` — no direct wallet connection; the host Safe provides the signer. Architecture and setup: [README.md](README.md). Releases: [docs/release-procedure.md](docs/release-procedure.md).
