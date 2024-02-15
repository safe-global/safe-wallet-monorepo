# HSGSuper Web App

[![License](https://img.shields.io/github/license/safe-global/safe-wallet-web)](https://github.com/safe-global/safe-wallet-web/blob/main/LICENSE)

Fork of [safe web app](https://github.com/safe-global/safe-wallet-web) to enable the scheduling and execution of transactions using [HSGSuperMod](https://github.com/Heph789/hsg-superuser), a safe module for managing on-chain councils/committees.

**Current features:**
* Schedule safe transactions through the attached TimelockController
* Execute safe transactions through the attached TimelockController

**Future Plans:** Currently, I am working on the backend indexer for this project. However, to make this interface fully complete, it should also:
* allow the user to create a safe with HSGSuperMod enabled
* allow the admin hat wearer (such as a DAO) to veto scheduled transactions
* allow the admin hat wearer to execute transactions through the safe

**Demo:** https://youtu.be/SeanzLWwVLs

**Learn more about...** [Hats](https://www.hatsprotocol.xyz/) and [Safe](https://safe.global/)

## Getting started with local development

### Environment variables

Create a `.env` file with environment variables. You can use the `.env.example` file as a reference.

Here's the list of all the environment variables:

| Env variable                                           | Description
| ------------------------------------------------------ | -----------
| `NEXT_PUBLIC_INFURA_TOKEN`                             | [Infura](https://docs.infura.io/infura/networks/ethereum/how-to/secure-a-project/project-id) RPC API token
| `NEXT_PUBLIC_SAFE_APPS_INFURA_TOKEN`                   | Infura token for Safe Apps, falls back to `NEXT_PUBLIC_INFURA_TOKEN`
| `NEXT_PUBLIC_IS_PRODUCTION`                            | Set to `true` to build a minified production app
| `NEXT_PUBLIC_GATEWAY_URL_PRODUCTION`                   | The base URL for the [Safe Client Gateway](https://github.com/safe-global/safe-client-gateway)
| `NEXT_PUBLIC_GATEWAY_URL_STAGING`                      | The base CGW URL on staging
| `NEXT_PUBLIC_SAFE_VERSION`                             | The latest version of the Safe contract, defaults to 1.3.0
| `NEXT_PUBLIC_WC_PROJECT_ID`                            | [WalletConnect v2](https://docs.walletconnect.com/2.0/cloud/relay) project ID
| `NEXT_PUBLIC_TENDERLY_ORG_NAME`                        | [Tenderly](https://tenderly.co) org name for Transaction Simulation
| `NEXT_PUBLIC_TENDERLY_PROJECT_NAME`                    | Tenderly project name
| `NEXT_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL`           | Tenderly simulation URL
| `NEXT_PUBLIC_BEAMER_ID`                                | [Beamer](https://www.getbeamer.com) is a news feed for in-app announcements
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`                    | [GTM](https://tagmanager.google.com) project id
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_DEVELOPMENT_AUTH`      | Dev GTM key
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_LATEST_AUTH`           | Preview GTM key
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_LIVE_AUTH`             | Production GTM key
| `NEXT_PUBLIC_SENTRY_DSN`                               | [Sentry](https://sentry.io) id for tracking runtime errors
| `NEXT_PUBLIC_SAFE_GELATO_RELAY_SERVICE_URL_PRODUCTION` | [Safe Gelato Relay Service](https://github.com/safe-global/safe-gelato-relay-service) URL to allow relaying transactions via Gelato
| `NEXT_PUBLIC_SAFE_GELATO_RELAY_SERVICE_URL_STAGING`    | Relay URL on staging
| `NEXT_PUBLIC_IS_OFFICIAL_HOST`                         | Whether it's the official distribution of the app, or a fork; has legal implications. Set to true only if you also update the legal pages like Imprint and Terms of use
| `NEXT_PUBLIC_REDEFINE_API`                             | Redefine API base URL
| `NEXT_PUBLIC_FIREBASE_OPTIONS_PRODUCTION`              | Firebase Cloud Messaging (FCM) `initializeApp` options on production
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY_PRODUCTION`            | FCM vapid key on production
| `NEXT_PUBLIC_FIREBASE_OPTIONS_STAGING`                 | FCM `initializeApp` options on staging
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY_STAGING`               | FCM vapid key on staging
| `NEXT_PUBLIC_SOCIAL_WALLET_OPTIONS_PRODUCTION`         | Web3Auth and Google credentials (production)
| `NEXT_PUBLIC_SOCIAL_WALLET_OPTIONS_STAGING`            | Web3Auth and Google credentials (staging)

If you don't provide some of the variables, the corresponding features will be disabled in the UI.

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
