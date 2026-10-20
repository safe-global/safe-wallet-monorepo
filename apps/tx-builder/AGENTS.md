# Tx-Builder AI Contributor Guidelines

`apps/tx-builder` is a **Safe App** (runs in an iframe inside Safe{Wallet}) for composing and batching custom contract interactions. Migrated from the separate safe-apps repo; it keeps its own stack.

## Stack divergence — root/web UI rules do NOT apply here

- **UI: MUI v6 + Emotion + styled-components.** The shadcn/Tailwind/vars.css rules from root and `apps/web` do not apply. Theme lives in `src/theme/` (MUI theme config).
- **State: React Context providers in `src/store/`** — not Redux/RTK.
- **Build: Vite.** Env vars use the `VITE_*` prefix (e.g. `VITE_TENDERLY_*`), not `NEXT_PUBLIC_*`.

## Commands

`yarn workspace @safe-global/tx-builder dev` (Vite dev server, port 4000) — plus the standard `build` / `test` / `lint` scripts.

Root `yarn verify:changed` does NOT cover this app; run `node scripts/verify.mjs --changed --workspace=tx-builder`.

## Testing

Unit tests are colocated. Page tests render the whole app with `renderApp()` from `src/test/app.tsx`. They replace the host with the Safe Apps SDK fake in `src/test/sdk.ts` (`jest.mock('@safe-global/safe-apps-react-sdk', () => jest.requireActual('../test/sdk').safeAppsReactSdkFake)`) and mock Sourcify, the Client Gateway and the Tenderly simulation API with the MSW server in `src/test/server.ts`, which `setupTests.ts` starts. The builder's own forms, uploads, library and simulation are tested here. The web Cypress suite at `apps/web/cypress/e2e/safe-apps/` keeps only the journeys that need the wallet around the iframe. `VITE_GATEWAY_URL` makes one Client Gateway serve every gateway request and the only ABI source; the isolated E2E stack uses it (see `apps/web/e2e/docs/ISOLATED_ENVIRONMENT.md`).

## Safe App constraints

The app talks to the host via `safe-apps-sdk` / `safe-apps-react-sdk` — no direct wallet connection; the host Safe provides the signer. Architecture and setup: [README.md](README.md). Releases: [docs/release-procedure.md](docs/release-procedure.md).
