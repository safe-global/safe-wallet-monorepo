# Drain Account

A Safe App that transfers all, or a selection, of a Safe's assets to one recipient in a single batch transaction.

## Development

```bash
# From the monorepo root
yarn install
yarn workspace @safe-global/drain-safe dev
```

The app runs at `http://localhost:4001`. Open it inside a local Safe{Wallet} as a custom Safe App: `/apps/open?safe=<prefix>:<address>&appUrl=http://localhost:4001`.

| Command                                             | Description      |
| --------------------------------------------------- | ---------------- |
| `yarn workspace @safe-global/drain-safe dev`        | Start dev server |
| `yarn workspace @safe-global/drain-safe build`      | Production build |
| `yarn workspace @safe-global/drain-safe test`       | Run unit tests   |
| `yarn workspace @safe-global/drain-safe lint`       | Run ESLint       |
| `yarn workspace @safe-global/drain-safe type-check` | TypeScript check |

## How it works

1. The app loads the Safe's balances from the host and hides the native token when it has no fiat value.
2. The user picks the assets and enters a recipient: an address, an address with the chain prefix, or an ENS name.
3. The app sends one transaction per asset: a plain value transfer for the native token, an ERC-20 `transfer` for each token.
4. The host shows the batch for review and signing.
