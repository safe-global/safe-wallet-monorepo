# Drain Account AI Contributor Guidelines

`apps/drain-safe` is the **Drain Account** Safe App. It runs in an iframe inside Safe{Wallet} and sends the whole balance of the selected assets to one recipient as a single batch. Migrated from the separate safe-react-apps repo.

## Stack divergence — root/web UI rules don't apply here

- **UI: MUI v6 + Emotion.** The theme comes from `generateMuiTheme` in `@safe-global/theme`; the shadcn/Tailwind/vars.css rules from root and `apps/web` do not apply.
- **Chain code: viem**, not ethers. `safe-apps-react-sdk` already bundles viem, so a second library only adds weight.
- **Build: Vite**, dev and preview on port 4001. `VITE_BASE_PATH` sets the asset base path for production (`/drain-safe/`).

## Commands

`yarn workspace @safe-global/drain-safe dev` — plus the standard `build` / `test` / `lint` / `type-check` scripts.

Root `yarn verify:changed` doesn't cover this app; run `node scripts/verify.mjs --changed --workspace=drain-safe`.

## Testing

Tests are colocated. `src/App.test.tsx` renders the whole app with `renderApp()` from `src/test/app.tsx`. It replaces the host with the Safe Apps SDK fake in `src/test/sdk.ts` (`jest.mock('@safe-global/safe-apps-react-sdk', () => jest.requireActual('./test/sdk').safeAppsReactSdkFake)`). `setupTests.ts` resets the fake before each test. The fake answers the ENS Universal Resolver through `sdk.eth.call`; register a name with `registerEnsName`. Build balances with `src/test/balances.ts`.

## Safe App constraints

The app talks to the host only through `safe-apps-sdk` / `safe-apps-react-sdk`; the host Safe provides the signer. `public/manifest.json` and `public/logo.svg` are read by the wallet to list the app — keep both at the build root.
