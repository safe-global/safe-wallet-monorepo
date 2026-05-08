# <img src="https://github.com/user-attachments/assets/b8249113-d515-4c91-a12a-f134813614e8" height="60" valign="middle" alt="Safe{Wallet}" style="background: #fff; padding: 20px; margin: 0 -20px" />

[![License](https://img.shields.io/github/license/safe-global/safe-wallet-web)](https://github.com/safe-global/safe-wallet-web/blob/main/LICENSE)
![Tests](https://img.shields.io/github/actions/workflow/status/safe-global/safe-wallet-web/test.yml?branch=main&label=tests)
![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/safe-global/safe-wallet-web)
[![GitPOAP Badge](https://public-api.gitpoap.io/v1/repo/safe-global/safe-wallet-web/badge)](https://www.gitpoap.io/gh/safe-global/safe-wallet-web)

# Safe{Wallet} web app

This project is now part of the **@safe-global/safe-wallet** monorepo! The monorepo setup allows centralized management
of multiple
applications and shared libraries. This workspace (`apps/web`) is the frontend of the Safe{Wallet} web app.

Safe{Wallet} is a smart contract wallet for Ethereum and other EVM chains. Based on Gnosis Safe multisig contracts.

You can run commands for this workspace in two ways:

1. **From the root of the monorepo using `yarn workspace` commands**
2. **From within the `apps/web` directory**

## Prerequisites

Except for the main monorepo prerequisites, no additional prerequisites are required for this workspace.

## Setup the Project

1. Install all dependencies from the **root of the monorepo**:

```bash
yarn install
```

## Contributing

Contributions, be it a bug report or a pull request, are very welcome. Please check
our [contribution guidelines](CONTRIBUTING.md) beforehand.

## Getting started with local development

### Environment variables

Create a `.env` file with environment variables. You can use the `.env.example` file as a reference.

Here's the list of all the environment variables:

| Env variable                                 | Description                                                                                                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BRAND_NAME`                     | The name of the app, defaults to "Wallet fork"                                                                                                                                                |
| `NEXT_PUBLIC_BRAND_LOGO`                     | The URL of the app logo displayed in the header                                                                                                                                               |
| `NEXT_PUBLIC_INFURA_TOKEN` ❕                | [Infura](https://docs.infura.io/infura/networks/ethereum/how-to/secure-a-project/project-id) RPC API token. **Required for wallet connection and transacting!**                               |
| `NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN`         | Infura token for Safe Apps, falls back to `NEXT_PUBLIC_INFURA_TOKEN`                                                                                                                          |
| `NEXT_PUBLIC_IS_PRODUCTION`                  | Set to `true` to build a minified production app                                                                                                                                              |
| `NEXT_PUBLIC_DEFAULT_TESTNET_CHAIN_ID`       | The default chain ID used when `NEXT_PUBLIC_IS_PRODUCTION` is set to `false`. Defaults to 11155111 (sepolia)                                                                                  |
| `NEXT_PUBLIC_DEFAULT_MAINNET_CHAIN_ID`       | The default chain ID used when `NEXT_PUBLIC_IS_PRODUCTION` is set to `true`. Defaults to 1 (mainnet). Must be set to another value if mainnet isn't configured in the chain configs from CGW. |
| `NEXT_PUBLIC_GATEWAY_URL_PRODUCTION`         | The base URL for the [Safe Client Gateway](https://github.com/safe-global/safe-client-gateway)                                                                                                |
| `NEXT_PUBLIC_GATEWAY_URL_STAGING`            | The base CGW URL on staging                                                                                                                                                                   |
| `NEXT_PUBLIC_SAFE_VERSION`                   | The latest version of the Safe contract, defaults to 1.4.1                                                                                                                                    |
| `NEXT_PUBLIC_WC_PROJECT_ID`                  | [WalletConnect v2](https://docs.walletconnect.com/2.0/cloud/relay) project ID                                                                                                                 |
| `NEXT_PUBLIC_TENDERLY_ORG_NAME`              | [Tenderly](https://tenderly.co) org name for Transaction Simulation                                                                                                                           |
| `NEXT_PUBLIC_TENDERLY_PROJECT_NAME`          | Tenderly project name                                                                                                                                                                         |
| `NEXT_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL` | Tenderly simulation URL                                                                                                                                                                       |
| `NEXT_PUBLIC_BEAMER_ID`                      | [Beamer](https://www.getbeamer.com) is a news feed for in-app announcements                                                                                                                   |
| `NEXT_PUBLIC_PROD_GA_TRACKING_ID`            | Prod GA property id                                                                                                                                                                           |
| `NEXT_PUBLIC_TEST_GA_TRACKING_ID`            | Test GA property id                                                                                                                                                                           |
| `NEXT_PUBLIC_SAFE_APPS_GA_TRACKING_ID`       | Safe Apps GA property id                                                                                                                                                                      |
| `NEXT_PUBLIC_SENTRY_DSN`                     | [Sentry](https://sentry.io) id for tracking runtime errors                                                                                                                                    |
| `NEXT_PUBLIC_IS_OFFICIAL_HOST`               | Whether it's the official distribution of the app, or a fork; has legal implications. Set to true only if you also update the legal pages like Imprint and Terms of use                       |
| `NEXT_PUBLIC_FIREBASE_OPTIONS_PRODUCTION`    | Firebase Cloud Messaging (FCM) `initializeApp` options on production                                                                                                                          |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY_PRODUCTION`  | FCM vapid key on production                                                                                                                                                                   |
| `NEXT_PUBLIC_FIREBASE_OPTIONS_STAGING`       | FCM `initializeApp` options on staging                                                                                                                                                        |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY_STAGING`     | FCM vapid key on staging                                                                                                                                                                      |
| `NEXT_PUBLIC_PROD_MIXPANEL_TOKEN`            | [Mixpanel](https://mixpanel.com) token for production analytics tracking                                                                                                                      |
| `NEXT_PUBLIC_STAGING_MIXPANEL_TOKEN`         | [Mixpanel](https://mixpanel.com) token for staging analytics tracking                                                                                                                         |

If you don't provide some of the variables, the corresponding features will be disabled in the UI.

### Running the app locally

From the root of the monorepo:

**Default (fastest):**

```bash
yarn workspace @safe-global/web dev
```

Uses [Rspack](https://rspack.dev) for faster development builds and hot reload. Optimized for speed with simplified MDX processing.

**Full features (Webpack + Experimental optimizations + PWA):**

```bash
yarn workspace @safe-global/web dev:full
```

Uses webpack with:

- Full MDX support (with remark plugins)
- Experimental package import optimizations (`optimizePackageImports`)
- PWA enabled in development mode

**Alternative commands:**

```bash
yarn workspace @safe-global/web start
```

Standard Next.js dev server (webpack, no optimizations)

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

> [!NOTE]
>
> From now on for brevity we will only show the command to run from the root of the monorepo. You can always run the command from the `apps/web` directory you just need to omit the `workspace @safe-global/web`.

## Lint

ESLint:

```
yarn workspace @safe-global/web lint --fix
```

Prettier:

```
yarn workspace @safe-global/web prettier
```

## Tests

Unit tests:

```
yarn workspace @safe-global/web test --watch
```

### Cypress tests

Build a static site:

```
yarn workspace @safe-global/web build
```

Serve the static files:

```
yarn workspace @safe-global/web serve
```

Launch the Cypress UI:

```
yarn workspace @safe-global/web cypress:open
```

You can then choose which e2e tests to run.
Some tests will require signer private keys, please include them in your .env file

## Component template

To create a new component from a template:

```
yarn workspace @safe-global/web cmp MyNewComponent
```

## Pre-push hooks

This repo has a pre-push hook that runs the linter (always) and the tests (if the `RUN_TESTS_ON_PUSH` env variable is set to true) before pushing. If you want to skip the hooks, you can use the `--no-verify` flag.

## Safe migration (1.3 → 1.4)

Migration from Safe 1.3.0 to 1.4.1 uses a **delegate call** to the [SafeMigration](https://docs.safe.global/advanced/smart-account-migration) contract (see [Safe Smart Account Migration](https://docs.safe.global/advanced/smart-account-migration)).

- **1/1 Safes**: If the Client Gateway (CGW) rejects delegate-call proposals (e.g. "Delegate call is disabled" on some chains), the app **executes the migration directly** with the connected wallet and skips proposing to the backend. The success screen shows a block explorer link.
- **Multi-sig Safes**: The normal flow is propose → sign → execute. For this to work, the **CGW must allow proposing delegate-call transactions** for the chain. The "delegate call disabled" restriction should apply only to **relay** (sponsorship), not to the **propose** endpoint. If your CGW returns 422 for delegate-call proposals, configure it to accept them so that migration transactions can be queued and signed by all owners; only relay should reject delegate calls.

**If the migration transaction reverts on-chain** (e.g. on [Kairos/Kaiascan](https://kairos.kaiascan.io)):

1. **L2 vs L1**: The app chooses `migrateSingleton` / `migrateWithFallbackHandler` (L1) or `migrateL2Singleton` / `migrateL2WithFallbackHandler` (L2) based on the chain’s `l2` flag in CGW. If your Safe 1.3.0 is the standard (L1) singleton but the chain is configured as L2, or the other way around, the migration path can be wrong. Check the CGW chain config for that chain and ensure `l2` matches the Safe’s singleton type.
2. **Gas**: Ensure the execution uses a sufficient gas limit; migration can require more gas than a normal call.
3. **Safe version**: Migration from 1.3.0 to 1.4.1 is supported; other versions may need a different flow.
4. **Contract deployment**: SafeMigration and the target singleton (1.4.1 L1 or L2) must be deployed on that chain. The app uses the chain-specific address from [@safe-global/safe-deployments](https://github.com/safe-global/safe-deployments); if the chain is not in the package, add it or use CGW contract overrides.

## Frameworks

This app is built using the following frameworks:

- [Safe Core SDK](https://github.com/safe-global/safe-core-sdk)
- [Safe Gateway SDK](https://github.com/safe-global/safe-gateway-typescript-sdk)
- Next.js
- React
- Redux
- MUI
- ethers.js
- web3-onboard
