# <img src="/public/images/logo.svg" height="60" valign="middle" alt="Safe{Wallet}" style="background: #fff; padding: 20px; margin: 0 -20px" />

[![License](https://img.shields.io/github/license/safe-global/safe-wallet-web)](https://github.com/safe-global/safe-wallet-web/blob/main/LICENSE)
![Tests](https://img.shields.io/github/actions/workflow/status/safe-global/safe-wallet-web/test.yml?branch=main&label=tests)
![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/safe-global/safe-wallet-web)
[![GitPOAP Badge](https://public-api.gitpoap.io/v1/repo/safe-global/safe-wallet-web/badge)](https://www.gitpoap.io/gh/safe-global/safe-wallet-web)

The default Safe web interface.

## Contributing

Contributions, be it a bug report or a pull request, are very welcome. Please check our [contribution guidelines](CONTRIBUTING.md) beforehand.

## Getting started with local development

### Environment variables

Create a `.env` file with environment variables. You can use the `.env.example` file as a reference.

Here's the list of all the required and optional variables:

| Env variable                                           |              | Description
| ------------------------------------------------------ | ------------ | -----------
| `NEXT_PUBLIC_INFURA_TOKEN`                             | optional     | [Infura](https://docs.infura.io/infura/networks/ethereum/how-to/secure-a-project/project-id) RPC API token
| `NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN`                   | optional     | Infura token for Safe Apps, falls back to `NEXT_PUBLIC_INFURA_TOKEN`
| `NEXT_PUBLIC_IS_PRODUCTION`                            | optional     | Set to `true` to build a minified production app
| `NEXT_PUBLIC_GATEWAY_URL_PRODUCTION`                   | optional     | The base URL for the [Safe Client Gateway](https://github.com/safe-global/safe-client-gateway)
| `NEXT_PUBLIC_GATEWAY_URL_STAGING`                      | optional     | The base CGW URL on staging
| `NEXT_PUBLIC_SAFE_VERSION`                             | optional     | The latest version of the Safe contract, defaults to 1.3.0
| `NEXT_PUBLIC_WC_BRIDGE`                                | optional     | [WalletConnect v1](https://docs.walletconnect.com/1.0/bridge-server) bridge URL, falls back to the public WC bridge
| `NEXT_PUBLIC_WC_PROJECT_ID`                            | optional     | [WalletConnect v2](https://docs.walletconnect.com/2.0/cloud/relay) project ID
| `NEXT_PUBLIC_TENDERLY_ORG_NAME`                        | optional     | [Tenderly](https://tenderly.co) org name for Transaction Simulation
| `NEXT_PUBLIC_TENDERLY_PROJECT_NAME`                    | optional     | Tenderly project name
| `NEXT_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL`           | optional     | Tenderly simulation URL
| `NEXT_PUBLIC_BEAMER_ID`                                | optional     | [Beamer](https://www.getbeamer.com) is a news feed for in-app announcements
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`                    | optional     | [GTM](https://tagmanager.google.com) project id
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_DEVELOPMENT_AUTH`      | optional     | Dev GTM key
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_LATEST_AUTH`           | optional     | Preview GTM key
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_LIVE_AUTH`             | optional     | Production GTM key
| `NEXT_PUBLIC_SENTRY_DSN`                               | optional     | [Sentry](https://sentry.io) id for tracking runtime errors
| `NEXT_PUBLIC_SAFE_GELATO_RELAY_SERVICE_URL_PRODUCTION` | optional     | [Safe Gelato Relay Service](https://github.com/safe-global/safe-gelato-relay-service) URL to allow relaying transactions via Gelato
| `NEXT_PUBLIC_SAFE_GELATO_RELAY_SERVICE_URL_STAGING`    | optional     | Relay URL on staging
| `NEXT_PUBLIC_IS_OFFICIAL_HOST`                         | optional     | Whether it's the official distribution of the app, or a fork; has legal implications. Set to true only if you also update the legal pages like Imprint and Terms of use
| `NEXT_PUBLIC_REDEFINE_API`                             | optional     | Redefine API base URL
| `NEXT_PUBLIC_FIREBASE_OPTIONS_PRODUCTION`              | optional     | Firebase Cloud Messaging (FCM) `initializeApp` options on production
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY_PRODUCTION`            | optional     | FCM vapid key on production
| `NEXT_PUBLIC_FIREBASE_OPTIONS_STAGING`                 | optional     | FCM `initializeApp` options on staging
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY_STAGING`               | optional     | FCM vapid key on staging
| `NEXT_DEFAULT_CHAIN_ID`                                | optional     | Default chain id to use when connecting to a wallet

If you don't provide some of the optional vars, the corresponding features will be disabled in the UI.

### Running the app locally

Install the dependencies:

```bash
yarn
```

Run the development server:

```bash
yarn start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Lint

ESLint:

```
yarn lint --fix
```

Prettier:

```
yarn prettier
```

## Tests

Unit tests:

```
yarn test --watch
```

### Cypress tests

Build a static site:

```
yarn build
```

Serve the static files:

```
yarn serve
```

Launch the Cypress UI:

```
yarn cypress:open
```

You can then choose which e2e tests to run.

## Component template

To create a new component from a template:

```
yarn cmp MyNewComponent
```

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
