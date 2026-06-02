# Data Integrity

Use these examples when changing address-book merges, Safe identity, RTK
mutations, or UI predicates derived from multiple collections.

## rtk-mutation-results

Use this when a mutation result controls success UI or local deletion.

Prefer:

```ts
const result = await deletePrivate(args)
if ('error' in result) {
  showError()
  return
}

setRemoved(true)
showSuccess()
```

Also acceptable:

```ts
try {
  await deletePrivate(args).unwrap()
  setRemoved(true)
  showSuccess()
} catch {
  showError()
}
```

Avoid:

```ts
await deletePrivate(args)
setRemoved(true)
showSuccess()
```

Why:

RTK Query mutation triggers do not throw by default. They resolve to an object
that can contain `error`.

## per-chain-contact-merges

Use this when merging space, private, and local contacts.

Prefer:

```ts
const spaceChainIds = new Set(
  spaceContacts
    .filter((space) => sameAddress(space.address, privateContact.address))
    .flatMap((space) => space.chainIds),
)

const remainingChainIds = privateContact.chainIds.filter((chainId) => {
  return !spaceChainIds.has(chainId)
})
```

Avoid:

```ts
const filteredPrivate = privateContacts.filter((privateContact) => {
  return !spaceContacts.some((space) => sameAddress(space.address, privateContact.address))
})
```

Why:

Address-only dedupe drops private contacts on chains that are not covered by
the higher-priority space contact.

## loading-vs-fetching

Use this when RTK Query state controls whether existing content disappears.

Prefer:

```tsx
const { data, isLoading, isFetching } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)

if (isLoading) return <Spinner />

return <Accounts data={data} isRefreshing={isFetching} />
```

Avoid:

```tsx
const { data, isFetching } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)

if (isFetching) return <Spinner />

return <Accounts data={data} />
```

Why:

`isFetching` becomes true on refetch. Use it to show refresh affordances, not
to hide already-loaded content unless that is the intended UX.

## fallback-preserving-maps

Use this when adding a new upstream response shape beside legacy fields.

Prefer:

```ts
return {
  [StatusGroup.THREAT]: threatAnalysis?.THREAT
    ? mapThreat(threatAnalysis.THREAT)
    : mapLegacyThreat(findings.THREAT_ANALYSIS),
  [StatusGroup.BALANCE_CHANGE]: threatAnalysis?.BALANCE_CHANGE
    ? mapBalance(threatAnalysis.BALANCE_CHANGE)
    : mapLegacyBalance(balanceChanges),
}
```

Avoid:

```ts
if (threatAnalysis) {
  return transformThreatAnalysisResponse(threatAnalysis)
}
```

Why:

New response objects are often partial. Returning early can drop legacy fields
that still contain the data the UI needs.

## DATA-02 — Empty-state gating across multiple collections

Source: PR #7654 (RL-20260415-002)

### Avoid

```tsx
{
  addressBookItems.length === 0 ? (
    <EmptyAddressBook />
  ) : (
    <Tabs>
      <TabPanel value="workspace">{/* workspaceContacts */}</TabPanel>
      <TabPanel value="local">{/* localContacts */}</TabPanel>
    </Tabs>
  )
}
```

### Prefer

```tsx
const isEmpty = workspaceContacts.length === 0 && localContacts.length === 0

{
  isEmpty ? <EmptyAddressBook /> : <Tabs>{/* both tabs */}</Tabs>
}
```

### Why

Gating the empty state on a single collection hides every other tab on the
page. Combine the count of every collection the page renders, or always render
the tabs container so each tab can show its own data.

## RTK-02 — Skip queries until the resource ID is resolved

Source: PR #7613 (RL-20260415-006)

### Avoid

```ts
const resourceId = paramId ?? currentId
const isSignedIn = useAppSelector(selectIsAuthenticated)

const { data } = useGetMembersQuery({ resourceId: Number(resourceId) }, { skip: !isSignedIn })
```

### Prefer

```ts
const resourceId = paramId ?? currentId
const numericId = Number(resourceId)
const isSignedIn = useAppSelector(selectIsAuthenticated)

const { data } = useGetMembersQuery(
  { resourceId: numericId },
  { skip: !isSignedIn || !Number.isFinite(numericId) || numericId <= 0 },
)
```

### Why

Auth-only `skip` lets queries fire with `0` or `NaN` IDs during route
hydration, producing avoidable failing requests and a flash of empty state.
Add a validity guard on the ID itself to the `skip` predicate.

## STATE-02 — Reset context state when its precondition flips

Source: PR #7409 (RL-20260318-007)

### Avoid

```ts
useEffect(() => {
  if (isEip712) {
    setContextSafeMessage(decodedMessage)
    setContextSafeMessageHash(safeMessageHash as `0x${string}`)
  }
}, [decodedMessage, isEip712, safeMessageHash, setContextSafeMessage, setContextSafeMessageHash])
```

### Prefer

```ts
useEffect(() => {
  if (isEip712) {
    setContextSafeMessage(decodedMessage)
    setContextSafeMessageHash(safeMessageHash as `0x${string}`)
  } else {
    setContextSafeMessage(undefined)
    setContextSafeMessageHash(undefined)
  }
}, [decodedMessage, isEip712, safeMessageHash, setContextSafeMessage, setContextSafeMessageHash])
```

### Why

Without the reset, downstream analysis keeps consuming the previously-decoded message after the user navigates to a non-EIP-712 transaction, producing incorrect threat-analysis input.

## DATA-03 — Drop analysis results when their fetch errored

Source: PR #7360 (RL-20260318-009)

### Avoid

```ts
const deadlockResults = useMemo(() => {
  if (!counterpartyData?.deadlock) return undefined
  return counterpartyData.deadlock as DeadlockAnalysisResults
}, [counterpartyData?.deadlock])
```

### Prefer

```ts
const deadlockResults = useMemo(() => {
  if (fetchError) return undefined
  if (!counterpartyData?.deadlock) return undefined
  return counterpartyData.deadlock as DeadlockAnalysisResults
}, [counterpartyData?.deadlock, fetchError])
```

### Why

Without the `fetchError` guard, an error response combined with a stale cache hit surfaces a critical deadlock warning that the user cannot dismiss because the underlying check did not actually run.

## DATA-02 — Hide native token without erasing aggregator balances

Source: PR #7352 (RL-20260320-001)

### Avoid

```ts
shouldHideNativeTokenValue ? (
  <FiatValue value="0" precise />
) : (
  <FiatValue value={nativeTokenFiat} precise />
)
```

### Prefer

```ts
const hasNonNativeBalances = balances.items.some(
  (item) => item.tokenInfo.type !== TokenType.NATIVE_TOKEN,
)
shouldHideNativeTokenValue
  ? <FiatValue value={hasNonNativeBalances ? fiatTotal : '0'} precise />
  : <FiatValue value={nativeTokenFiat} precise />
```

### Why

Counterfactual Safes can hold ERC-20s indexed by an off-chain aggregator (Zerion). Hiding only the native token while still surfacing the aggregator total preserves the user's real position; an unconditional `$0` lies to the user.

## Normalize RTK Query cache keys at one place

Source: PR (RL-20260218-002)

### Avoid

```ts
// useTotalBalances.ts
const normalizedCurrency = params.currency.toUpperCase()
useGetBalancesQuery({ fiatCode: normalizedCurrency })

// useRefetchBalances.ts (separate file)
const currency = useAppSelector(selectCurrency) // lowercase
dispatch(api.util.invalidateTags(['Balance', { fiatCode: currency }]))
```

### Prefer

```ts
// shared helper
export const normalizeCurrency = (c: string) => c.toUpperCase()

// both consumers
const fiatCode = normalizeCurrency(useAppSelector(selectCurrency))
```

### Why

RTK Query keys by argument value. Normalizing on read but not on invalidation means refetches and reads point at different cache entries; the UI never sees the fresh data.

## Compare addresses through sameAddress

Source: PR #7370 (RL-20260313-010)

### Avoid

```ts
// migrations.ts
for (const owner of overview.owners ?? []) {
  if (knownSafes[owner.toLowerCase()]) {
    // ...
  }
}

// signerThunks.ts (different file, same module)
if (sameAddress(signer.address, owner.value)) {
  // ...
}
```

### Prefer

```ts
import { sameAddress } from '@/utils/addresses'

// migrations.ts
for (const owner of overview.owners ?? []) {
  const match = Object.keys(knownSafes).find((k) => sameAddress(k, owner))
  if (match) {
    // ...
  }
}
```

### Why

`sameAddress` is the established equality contract. Reviewer noted the inconsistency between `toLowerCase()` lookups in migrations and `sameAddress()` in thunks — both ostensibly answer the same question.

## Three-state portfolio fallback: known-empty vs unknown vs errored

Source: PR #7301 (RL-20260310-011)

### Avoid

```ts
// packages/utils/src/hooks/portfolioBalances.ts
export const createPortfolioBalances = (balances: Balances): PortfolioBalances => ({
  ...balances,
  tokensFiatTotal: balances.fiatTotal,
  positionsFiatTotal: '0',
  positions: undefined, // collapses 'known empty' into 'unknown' → infinite skeleton
})

// apps/web/src/features/positions/index.tsx
if (isLoading || (!error && !protocols)) {
  return <PositionsSkeleton />
}
```

### Prefer

```ts
// useTotalBalances.ts — pass a precise empty flag through the aggregator
interface AggregateParams {
  // ...
  isPortfolioEmpty: boolean // only true when portfolio responded with empty arrays, never on error
}

const aggregateBalances = (p: AggregateParams): TotalBalancesResult => {
  const useTxServiceOnly = !p.hasPortfolioFeature || (p.needsPortfolioFallback && !p.isAllTokensSelected)
  if (useTxServiceOnly) {
    const result = buildTxServiceResult(p.txService, p.counterfactual, p.isCounterfactual, p.shared)
    if (result.data && p.isPortfolioEmpty) {
      return { ...result, data: { ...result.data, positions: [], positionsFiatTotal: '0' } }
    }
    return result
  }
  // ...
}

// positions/index.tsx — let isLoading drive the skeleton; undefined = unavailable
if (isLoading) return <PositionsSkeleton />
if (error || !protocols) return <PositionsUnavailable hasError={!!error} />
```

### Why

The original `positions: []` patch made portfolio errors look like known-empty; reverting to `undefined` re-broke empty Safes by feeding an infinite skeleton. The merged fix keeps `[]` only when the portfolio confirmed empty, leaves `undefined` for unknown, and trusts the merged-error branch to surface error states.

## Avoid scientific notation in derived decimal strings

Source: PR (RL-20260303-004)

### Avoid

```ts
function fiatToToken(validInput: number, rate: number, maxDecimals: number) {
  if (validInput <= 0 || rate <= 0) return ''
  const raw = (validInput / rate).toString() // "1.6e-7" for small results
  return truncateToDecimals(raw, maxDecimals)
}
// safeParseUnits(rawAmount, decimals) later throws on the exponent form
```

### Prefer

```ts
function fiatToToken(validInput: number, rate: number, maxDecimals: number) {
  if (validInput <= 0 || rate <= 0) return ''
  const raw = (validInput / rate).toFixed(maxDecimals) // plain decimal
  return truncateToDecimals(raw, maxDecimals)
}
```

### Why

JS `toString()` switches to exponent form below ~1e-6. Token amount parsers do not accept exponents, so users see a valid Review screen and only fail at signing time.

## Reset error state in retry handlers

Source: PR (RL-20260306-006)

### Avoid

```ts
const refreshToken = useCallback(() => {
  if (!widgetIdRef.current) return
  window.turnstile?.reset(widgetIdRef.current)
  setIsLoading(true)
  // CaptchaModal still shows "Verification failed" because `error` is truthy
}, [])
```

### Prefer

```ts
const refreshToken = useCallback(() => {
  if (!widgetIdRef.current) return
  window.turnstile?.reset(widgetIdRef.current)
  setError(null) // clear stale error first
  setIsLoading(true)
}, [])
```

### Why

UI components conditionally render error messages on the truthiness of `error`; without resetting it, retry leaves the user staring at the previous failure even though a fresh attempt is in flight.

## Compare addresses with sameAddress(), not toLowerCase()

Source: PR (RL-20260309-007)

### Avoid

```ts
import type { OwnerChange } from '../types'

function projectRemove(currentOwners: string[], change: { ownerAddress: string }) {
  return {
    owners: currentOwners.filter((o) => o.toLowerCase() !== change.ownerAddress.toLowerCase()),
  }
}
```

### Prefer

```ts
import { sameAddress } from '@safe-global/utils/utils/addresses'

function projectRemove(currentOwners: string[], change: { ownerAddress: string }) {
  return {
    owners: currentOwners.filter((o) => !sameAddress(o, change.ownerAddress)),
  }
}
```

### Why

`sameAddress` already handles checksum-vs-lowercase, undefined inputs, and the 0x prefix. Inline `.toLowerCase()` reimplements it inconsistently and is easy to forget on one branch (e.g. swapOwner vs removeOwner).

## NUM-02 — Guard numeric coercion of external strings

Source: PR #7875, #7897, #7856 (RL-20260522-003, RL-20260526-002, RL-20260526-003)

### Avoid

```ts
const id = Number(rawId) // '' / '  ' → 0, 'abc' → NaN
dispatch(endpoint.initiate({ id })) // calls the API with NaN

const value = Number(fiatTotal) // Number('   ') === 0 → renders a known $0 for unknown input
const status = threshold <= 1 ? 'READY' : 'PENDING' // invalid threshold 0 silently becomes READY
```

### Prefer

```ts
const parseId = (raw: string | null): number | null => {
  const n = Number(raw?.trim())
  return raw && raw.trim() !== '' && Number.isFinite(n) ? n : null
}
const id = parseId(rawId)
if (id === null) return // skip rather than call with NaN

if (fiatTotal == null || fiatTotal.trim() === '') return UNKNOWN // distinct from known 0
const value = Number(fiatTotal.trim())
const status = threshold === 1 ? 'READY' : 'PENDING' // exact floor — invalid 0 surfaces
```

### Why

`Number()` of an external string yields `0` for empty/whitespace and `NaN` for non-numeric input; both then flow silently into API args, aggregates, or status decisions. Parse through a guarded helper that rejects non-finite results, keep "known zero" distinct from "unknown/unloaded", and use exact comparisons (`=== 1`) where a valid floor exists so malformed values surface instead of being absorbed.

## SEC-02 — Gate destructive operations on a confirmed cause

Source: PR #7901 (RL-20260528-001)

### Avoid

```ts
const key = await keyStorage.getPrivateKey(addr) // returns undefined on cancel/lockout too
if (!key) {
  await keyStorage.removePrivateKey(addr, { requireAuthentication: false }) // wipes signer on a cancelled prompt
  dispatch(removeSigner(addr))
  return ok()
}

await keyStorage.removePrivateKey(addr) // pre-delete before the re-import is stored → data loss if store fails
await storePrivateKey(addr, input)
```

### Prefer

```ts
let invalidated = false
let key: string | undefined
try {
  key = await keyStorage.getPrivateKey(addr)
} catch (e) {
  if (e instanceof BiometryInvalidationError) invalidated = true
  else throw e
}
if (!key) {
  if (!invalidated) return error(STORAGE_ERROR) // cancel/transient → preserve prior path
  await keyStorage.removePrivateKey(addr, { requireAuthentication: false }) // only on confirmed invalidation
  dispatch(removeSigner(addr))
  return ok()
}
```

### Why

A function that returns `undefined`/falsy for cancelled prompts and transient lockouts as well as true key loss must not treat every falsy result as license to perform an irreversible action — a user who cancels would silently lose their signer. Gate destructive operations on the specific confirmed cause, keep the prior error path for ambiguous failures, and never delete existing data before its replacement is durably stored.
