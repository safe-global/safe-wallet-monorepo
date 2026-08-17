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
only place `rpcHost` is derived, and it returns `URL.host` — which by construction excludes path,
query, fragment and userinfo — behind an allow-list pattern for the resulting value. Unit tests
in `apps/web/src/hooks/wallets/__tests__/rpcEndpointInfo.test.ts` assert the token is absent for
path, query and userinfo placements. Never widen this to `URL.href`, `URL.pathname` or the raw
URL.

This property is scoped to `rpcHost`. It is **not** a claim that the Infura token cannot reach
Datadog by some other route — see the known gap below.

The `wallet` kind deliberately carries **no** host: the wallet's upstream endpoint is the user's
own and is not ours to record.

`custom` hostnames are the user's own endpoint and are reported as-is. Several hosted providers
put a per-tenant identifier in the subdomain (`<node-id>.p2pify.com`, `<name>-<rand>.quiknode.pro`),
so a `custom` `rpcHost` can be a weak account identifier. It is kept because attributing a user's
own RPC is the point of the `custom` kind; revisit if that trade-off changes.

### Known gap — the error _message_ channel is not sanitised

`rpcHost` is safe; `CodedException.message` is not, and it is a separate path into Datadog.
`ethers` folds `info.requestUrl` into `error.message` for any non-2xx `SERVER_ERROR` — including
Infura 401/429/5xx, exactly the "our RPC is degraded" cases this attribution exists to measure.
`CodedException` then interpolates that message unsanitised and `logger.warn` / `logger.error`
forward it to `datadogRum.addAction` / `addError`.

`sanitizeErrorMessage` does not cover this: its `/0x[a-fA-F0-9]{40,}/g` pattern does not match an
Infura project ID (32 hex chars, no `0x` prefix). Its output has no production consumer at all —
`sanitizedMessage` is computed by `normalizeError` but never read outside its own unit tests.
Mixpanel is clean for a stronger reason: `trackErrorSurfaced` emits enums (`domain`/`type`/`layer`/
`code`/`isUserFacing`) and whitelisted context only, and never emits a message field in the first
place. **Mixpanel is clean; the Datadog message field is not.**

This is pre-existing and is tracked separately — it is not introduced or widened by the
attribution work described here. Practical consequence for anyone adding a call site: do not pass
a raw provider error into `logError` / `trackError` on an RPC path until that is fixed. That is
why `useSiwe` passes `undefined` as the thrown error and reports context only.

Five call sites still do pass a raw provider error message today — all pre-existing, none
introduced or widened by this PR:

- `apps/web/src/hooks/useGasLimit.ts:87` — `Errors._612`
- `apps/web/src/components/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/hooks.ts:335` —
  `Errors._612`
- `apps/web/src/features/gtf/hooks/useHistoryFeesBreakdown.ts:123` — `Errors._612`
- `apps/web/src/features/spending-limits/hooks/useSpendingLimits.ts:47` — `Errors._609`
- `apps/web/src/hooks/coreSDK/useInitSafeCoreSDK.ts:57` — `ErrorCodes._105`

These are the inventory for the follow-up sanitisation ticket.

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

# Wallet-side failures. Currently SIWE (640) only — the 804 tx-execution
# family is not instrumented yet because those paths can also be relayed.
# User-declined signatures are excluded at the call site, not by this query.
@context.rpc_endpoint_kind:wallet

# Call sites still missing attribution
-@context.rpc_endpoint_kind:*
```

## Prerequisite for an "our RPC is degraded" monitor

A monitor on RPC error volume is only safe once `@context.rpc_endpoint_kind:infura` is a
filter on it — without it, BSC's public node produces false pages. Scope any such monitor to
`infura`, and alert on `rpc_endpoint_kind:infura` error count per unique session rather than raw
event count, because the underlying retry loop (WA-2525) inflates events per session.
