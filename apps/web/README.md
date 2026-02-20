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
our [contribution guidelines](../../CONTRIBUTING.md) beforehand.

## Getting started with local development

### Environment variables

Create a `.env` file with environment variables. You can use the `.env.example` file as a reference.

Here's the list of all the environment variables:

| Env variable                                  | Description                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_INFURA_TOKEN` ❕                 | [Infura](https://docs.infura.io/infura/networks/ethereum/how-to/secure-a-project/project-id) RPC API token. **Required for wallet connection and transacting!**                               |
| `NEXT_PUBLIC_WC_PROJECT_ID`                   | [WalletConnect v2](https://docs.walletconnect.com/2.0/cloud/relay) project ID                                                                                                                 |
| `NEXT_PUBLIC_IS_OFFICIAL_HOST`                | Whether it's the official distribution of the app, or a fork; has legal implications. Set to true only if you also update the legal pages like Imprint and Terms of use                       |
| `NEXT_PUBLIC_IS_PRODUCTION`                   | Set to `true` to build a minified production app                                                                                                                                              |
| `NEXT_PUBLIC_BRAND_NAME`                      | The name of the app, defaults to "Wallet fork"                                                                                                                                                |
| `NEXT_PUBLIC_BRAND_LOGO`                      | The URL of the app logo displayed in the header                                                                                                                                               |
| `NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN`          | Infura token for Safe Apps, falls back to `NEXT_PUBLIC_INFURA_TOKEN`                                                                                                                          |
| `NEXT_PUBLIC_DEFAULT_TESTNET_CHAIN_ID`        | The default chain ID used when `NEXT_PUBLIC_IS_PRODUCTION` is set to `false`. Defaults to 11155111 (sepolia)                                                                                  |
| `NEXT_PUBLIC_DEFAULT_MAINNET_CHAIN_ID`        | The default chain ID used when `NEXT_PUBLIC_IS_PRODUCTION` is set to `true`. Defaults to 1 (mainnet). Must be set to another value if mainnet isn't configured in the chain configs from CGW. |
| `NEXT_PUBLIC_GATEWAY_URL_PRODUCTION`          | The base URL for the [Safe Client Gateway](https://github.com/safe-global/safe-client-gateway)                                                                                                |
| `NEXT_PUBLIC_GATEWAY_URL_STAGING`             | The base CGW URL on staging                                                                                                                                                                   |
| `NEXT_PUBLIC_SAFE_VERSION`                    | The latest version of the Safe contract, defaults to 1.4.1                                                                                                                                    |
| `NEXT_PUBLIC_SAFE_STATUS_PAGE_URL`            | URL to the Safe status page                                                                                                                                                                   |
| `NEXT_PUBLIC_TENDERLY_ORG_NAME`               | [Tenderly](https://tenderly.co) org name for Transaction Simulation                                                                                                                           |
| `NEXT_PUBLIC_TENDERLY_PROJECT_NAME`           | Tenderly project name                                                                                                                                                                         |
| `NEXT_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL`  | Tenderly simulation URL                                                                                                                                                                       |
| `NEXT_PUBLIC_BLOCKAID_API`                    | [Blockaid](https://www.blockaid.io) API URL for transaction security scanning                                                                                                                 |
| `NEXT_PUBLIC_BLOCKAID_CLIENT_ID`              | Blockaid client ID                                                                                                                                                                            |
| `NEXT_PUBLIC_BEAMER_ID`                       | [Beamer](https://www.getbeamer.com) is a news feed for in-app announcements                                                                                                                   |
| `NEXT_PUBLIC_PROD_GA_TRACKING_ID`             | Prod GA property id                                                                                                                                                                           |
| `NEXT_PUBLIC_TEST_GA_TRACKING_ID`             | Test GA property id                                                                                                                                                                           |
| `NEXT_PUBLIC_SAFE_APPS_GA_TRACKING_ID`        | Safe Apps GA property id                                                                                                                                                                      |
| `NEXT_PUBLIC_SENTRY_DSN`                      | [Sentry](https://sentry.io) id for tracking runtime errors                                                                                                                                    |
| `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`            | [Datadog](https://www.datadoghq.com) client token for monitoring                                                                                                                              |
| `NEXT_PUBLIC_FIREBASE_OPTIONS_PRODUCTION`     | Firebase Cloud Messaging (FCM) `initializeApp` options on production                                                                                                                          |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY_PRODUCTION`   | FCM vapid key on production                                                                                                                                                                   |
| `NEXT_PUBLIC_FIREBASE_OPTIONS_STAGING`        | FCM `initializeApp` options on staging                                                                                                                                                        |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY_STAGING`      | FCM vapid key on staging                                                                                                                                                                      |
| `NEXT_PUBLIC_PROD_MIXPANEL_TOKEN`             | [Mixpanel](https://mixpanel.com) token for production analytics tracking                                                                                                                      |
| `NEXT_PUBLIC_STAGING_MIXPANEL_TOKEN`          | Mixpanel token for staging analytics tracking                                                                                                                                                 |
| `NEXT_PUBLIC_PROD_HYPERNATIVE_OUTREACH_ID`    | Hypernative outreach ID for production                                                                                                                                                        |
| `NEXT_PUBLIC_STAGING_HYPERNATIVE_OUTREACH_ID` | Hypernative outreach ID for staging                                                                                                                                                           |
| `NEXT_PUBLIC_ECOSYSTEM_ID_ADDRESS`            | Ecosystem ID address                                                                                                                                                                          |
| `NEXT_PUBLIC_SPACES_SAFE_ACCOUNTS_LIMIT`      | Maximum number of Safe accounts allowed in Spaces                                                                                                                                             |
| `NEXT_PUBLIC_IS_BEHIND_IAP`                   | Set to `true` when the app is behind an Identity-Aware Proxy                                                                                                                                  |
| `NEXT_PUBLIC_HYPERNATIVE_API_BASE_URL`        | [Hypernative](https://hypernative.io) API base URL for threat analysis. Production: `https://api.hypernative.xyz`                                                                             |
| `NEXT_PUBLIC_HYPERNATIVE_CLIENT_ID`           | Hypernative OAuth client ID. Defaults to `SAFE_WALLET_WEB` for production                                                                                                                     |
| `NEXT_PUBLIC_HYPERNATIVE_REDIRECT_URI`        | Custom OAuth redirect URI (optional). If not set, dynamically generated as `{origin}/hypernative/oauth-callback`                                                                              |
| `NEXT_PUBLIC_HN_MOCK_AUTH`                    | Enable mock authentication mode for Hypernative (set to `true` for local development without real OAuth). Simplifies testing by bypassing popup flow                                          |

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

**Interactive mode:**

Launch the Cypress UI:

```
yarn workspace @safe-global/web cypress:open
```

You can then choose which e2e tests to run.

**Headless mode:**

Run all tests in headless mode:

```
yarn workspace @safe-global/web cypress:run
```

Run a specific test file in headless mode with Chrome:

```
npx cypress run --browser chrome --headless --spec "cypress/e2e/regression/example.cy.js"
```

Run multiple test files:

```
npx cypress run --browser chrome --headless --spec "cypress/e2e/regression/*.cy.js"
```

Some tests will require signer private keys, please include them in your .env file

## Component template

To create a new component from a template:

```
yarn workspace @safe-global/web cmp MyNewComponent
```

## Pre-push hooks

This repo has a pre-push hook that runs the linter (always) and the tests (if the `RUN_TESTS_ON_PUSH` env variable is set to true) before pushing. If you want to skip the hooks, you can use the `--no-verify` flag.

## Storybook

This project uses Storybook for developing and documenting UI components in isolation.

```bash
yarn workspace @safe-global/web storybook
```

This will start Storybook on [http://localhost:6006](http://localhost:6006).

When creating new components, add a corresponding `.stories.tsx` file for documentation. See `docs/storybook-snapshots.md` for more information on Storybook snapshot testing.

## Frameworks

This app is built using the following frameworks:

- [Safe Protocol Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit) and [API Kit](https://github.com/safe-global/safe-core-sdk/tree/main/packages/api-kit)
- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [MUI v6](https://mui.com/)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [web3-onboard](https://onboard.blocknative.com/)
