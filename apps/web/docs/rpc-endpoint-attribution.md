# RPC endpoint attribution

Every RPC failure we report is tagged with **which endpoint we were talking to**, so
"couldn't reach the blockchain" is attributable to a specific provider instead of being an
undifferentiated bucket (WA-2951).

## What is emitted

| Tag                       | Datadog RUM attribute        | Mixpanel property   |
| ------------------------- | ---------------------------- | ------------------- |
| `context.rpcEndpointKind` | `@context.rpc_endpoint_kind` | `RPC Endpoint Kind` |
| `context.rpcHost`         | `@context.rpc_host`          | `RPC Host`          |

`rpcEndpointKind` is one of:

| Kind            | Meaning                                                           | Whose fault         |
| --------------- | ----------------------------------------------------------------- | ------------------- |
| `infura`        | Chain RPC with `authentication: 'API_KEY_PATH'` — our key         | Ours (paid)         |
| `chain_default` | Chain RPC with no authentication, e.g. `bsc-dataseed.binance.org` | A free public node  |
| `custom`        | An RPC the user configured in Settings                            | The user's endpoint |
| `wallet`        | The connected wallet's own `BrowserProvider`                      | The user's wallet   |
| `unknown`       | An RPC failure on a provider we did not build                     | Unattributable      |

`unknown` exists so "we could not attribute this failure" stays distinguishable from
"this call site is not instrumented yet" (which shows up as the tag being absent).

## Where it comes from

Attribution is derived once, at provider construction, and recorded against the provider
instance (`apps/web/src/hooks/wallets/rpcEndpointInfo.ts`):

- `createWeb3ReadOnly` / `createSafeAppsWeb3Provider` → `getRpcEndpointInfo(chain.rpcUri, …)`
- `createWeb3` → `wallet`

A catch site turns the failing provider into `ErrorContext` with
`getRpcErrorContext(provider)` and passes it to `logError` / `trackError`:

```ts
logError(Errors._612, gasLimitError.message, getRpcErrorContext(web3ReadOnly))
```

Deriving it from the provider rather than from the current chain matters: providers are also
built for _other_ chains (Safe creation replay, multichain deployment) and for Safe Apps with a
different token, so current-chain state is the wrong answer at those call sites.

## `rpcHost` never contains a credential

Our keyed RPC URLs carry the Infura token **in the path** (`API_KEY_PATH`). `getRpcHost` is the
only place a host is derived, and it returns `URL.host` — which by construction excludes path,
query, fragment and userinfo — behind an allow-list pattern for the resulting value. Unit tests
in `apps/web/src/hooks/wallets/__tests__/rpcEndpointInfo.test.ts` assert the token is absent for
path, query and userinfo placements. Never widen this to `URL.href`, `URL.pathname` or the raw
URL.

The `wallet` kind deliberately carries **no** host: the wallet's upstream endpoint is the user's
own and is not ours to record.

## Datadog set-up (not yet done — console configuration)

Not created by this change; do it in the Datadog console:

1. Create RUM facets on `@context.rpc_endpoint_kind` (string) and `@context.rpc_host` (string),
   scoped to Error and Action events.
2. Add `@context.rpc_endpoint_kind` as a group-by on the frontend error dashboard's top error
   clusters.

Queries these facets enable, replacing the report's manual message-pattern matching:

```
# Share of RPC errors that are actually ours
@context.rpc_endpoint_kind:infura

# Public-node noise that must never page us
@context.rpc_endpoint_kind:chain_default @context.rpc_host:bsc-dataseed.binance.org

# Wallet-side failures (the code 804 family)
@context.rpc_endpoint_kind:wallet

# Call sites still missing attribution
-@context.rpc_endpoint_kind:*
```

## Prerequisite for an "our RPC is degraded" monitor

A monitor on RPC error volume is only safe once `@context.rpc_endpoint_kind:infura` is a
filter on it — without it, BSC's public node produces false pages. Scope any such monitor to
`infura`, and alert on `rpc_endpoint_kind:infura` error count per unique session rather than raw
event count, because the underlying retry loop (WA-2525) inflates events per session.
