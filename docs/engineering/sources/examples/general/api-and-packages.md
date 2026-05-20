# API and Packages

Use these examples when changing component prop surfaces, switching between deep
imports and public entrypoints, or moving config/types between apps and shared
packages.

## API-01 — Drop-in replacements preserve the original prop surface

Source: PR #7500 (RL-20260410-002)

### Avoid

```ts
type SkeletonProps = { height: number; width: number; radius?: number; children?: ReactNode }

export function Skeleton({ height, width, radius = 8, children }: SkeletonProps) {
  const groupShow = useContext(SkeletonGroupContext)
  const show = groupShow ?? !children
  // ...visibility hard-coded from internal state; caller-supplied `show` is ignored.
}
```

### Prefer

```ts
type SkeletonProps = {
  height: number
  width: number
  radius?: number
  show?: boolean // honoured for parity with the previous implementation
  children?: ReactNode
}

export function Skeleton({ height, width, radius = 8, show, children }: SkeletonProps) {
  const groupShow = useContext(SkeletonGroupContext)
  const resolvedShow = show ?? groupShow ?? !children
  // ...resolvedShow drives visibility, so existing call sites keep working.
}
```

### Why

The replacement kept the export name but stopped reading the caller-supplied
`show` prop, so every screen that passed `show={false}` or `show` silently
changed behavior. A drop-in must accept and honor the props the previous
implementation supported, otherwise call sites regress without any compiler
signal.

## API-03 — Import from package public entrypoints, not deep dist paths

Source: PR #7617 (RL-20260415-008)

### Avoid

```ts
import { generatePreValidatedSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import EthSafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction'
import { encodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils/transactions/utils'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
```

### Prefer

```ts
import { EthSafeTransaction, encodeMultiSendData, generatePreValidatedSignature } from '@safe-global/protocol-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/constants'
```

### Why

Reaching into `dist/src/...` ties the consumer to a package's internal layout
and breaks on every refactor or version bump. Importing from the public
entrypoint is what the package author commits to. Collapsing same-package
imports into one statement also avoids quirks like the duplicated `utils/utils`
segment that appears when the deep path mirrors the shared workspace name.

## PKG-01 — Do not duplicate shared package config in app source

Source: PR #7617 (RL-20260415-007)

### Avoid

```ts
// apps/web/src/config/chains.ts — a near-copy of packages/utils/src/config/chains.ts
export const chains = {
  ethereum: '1',
  polygon: '137',
  // ...slightly out of sync: missing the entry the shared file added last week.
}
```

### Prefer

```ts
// apps/web/src/config/chains.ts
export { chains } from '@safe-global/utils/config/chains'
```

### Why

Two parallel copies of the same config drift the moment one side is updated and
the other isn't, and the diff is invisible at review time because each file
looks self-consistent. Re-export from the shared package so there is exactly
one source of truth, and the type system propagates additions or removals to
every consumer.

## TEST-03 — Delegate hooks to the shared util instead of redeclaring the mapping

Source: PR #7439 (RL-20260317-003)

### Avoid

```ts
// apps/web/src/hooks/useNativeTokenDisplay.ts
export const useNativeTokenDisplay = (): NativeTokenDisplay => {
  const hideNativeToken = useHasFeature(FEATURES.HIDE_NATIVE_TOKEN) === true
  // duplicates SHOW_ALL / HIDE_NATIVE shape from packages/utils
  return hideNativeToken ? HIDE_NATIVE : SHOW_ALL
}
```

### Prefer

```ts
// apps/web/src/hooks/useNativeTokenDisplay.ts
import { getNativeTokenDisplay, NATIVE_TOKEN_DISPLAY_DEFAULT, type NativeTokenDisplay } from '@safe-global/utils'

export const useNativeTokenDisplay = (): NativeTokenDisplay => {
  const chain = useCurrentChain()
  return chain ? getNativeTokenDisplay(chain) : NATIVE_TOKEN_DISPLAY_DEFAULT
}
```

### Why

Re-declaring the capability shape in two places lets them drift the moment a new flag is added. The hook becomes a thin React adapter over the pure utility, which is testable independently.

## CI-01 — Same-repo guard for pull_request_target workflows

Source: PR #7396 (RL-20260318-008)

### Avoid

```ts
if: >-
  github.event.pull_request.merged == true ||
  (github.event.action == 'closed' && startsWith(github.event.pull_request.head.ref, 'release'))
```

### Prefer

```ts
if: >-
  github.event.pull_request.merged == true ||
  (github.event.action == 'closed' &&
   startsWith(github.event.pull_request.head.ref, 'release') &&
   github.event.pull_request.head.repo.full_name == github.repository)
```

### Why

`pull_request_target` runs with the base repo's secrets and write permissions. Without the same-repo check, a fork can open a PR with a `release/*` branch name and a malicious close to trigger the privileged job.

## OBS-01 — Use the shared analytics param key

Source: PR #7388 (RL-20260319-001)

### Avoid

```ts
trackEvent(SPACE_EVENTS.SPACES_SIWE_FAILURE, {
  failure_reason: error instanceof Error ? error.message : String(error),
})
```

### Prefer

```ts
trackEvent(SPACE_EVENTS.SPACES_SIWE_FAILURE, {
  [MixpanelEventParams.FAILURE_REASON]: error instanceof Error ? error.message : String(error),
})
```

### Why

Free-form keys split a single dimension across multiple property names in Mixpanel; using the shared enum keeps a stable schema for downstream queries.

## CODE-01 — Compare severities through a named helper

Source: PR #7360 (RL-20260318-011)

### Avoid

```ts
const hasCriticalDeadlock =
  !!deadlockSeverity && SEVERITY_PRIORITY[deadlockSeverity] <= SEVERITY_PRIORITY[Severity.CRITICAL]
```

### Prefer

```ts
const hasCriticalDeadlock = isSeverityHigherOrEqual(deadlockSeverity, Severity.CRITICAL)
const hasCriticalThreat = isSeverityHigherOrEqual(threatSeverity, Severity.CRITICAL)
```

### Why

The numeric comparison is non-obvious (lower number = higher severity), and inlining it in every branch invites subtle off-by-one mistakes. A named helper makes the intent explicit and reusable across the related signals.

## Treat AUTO_GENERATED clients as derived output

Source: PR (RL-20260219-001)

### Avoid

```ts
// packages/store/src/gateway/AUTO_GENERATED/spaces.ts (hand-edited)
export type GetSpaceResponse = {
  id: number
  name: string
  members: MemberDto[]
  safeCount: number // added by hand without updating schema.json
}
```

### Prefer

```ts
// packages/store/scripts/api-schema/schema.json — update first, then run
//   yarn workspace @safe-global/store build:dev
// AUTO_GENERATED files are derived output and must not be edited directly.
// Consumers should also fall back when the field is optional in the contract:
const numberOfAccounts = space.safeCount ?? 0
```

### Why

Hand-edited generated types vanish on the next codegen run, breaking every consumer that depended on the synthetic field. Update the source schema, regenerate, and guard fields that are still optional in the contract.

## Close over hook deps instead of threading 6 args

Source: PR #7389 (RL-20260311-005)

### Avoid

```ts
const { trustedSafeItems, ownedSafeItems } = useMemo(() => {
  const buildItem = (chainId: string, address: string) =>
    _buildSafeItem(chainId, address, walletAddress, allAdded, allOwned, allUndeployed, allVisitedSafes, allSafeNames)
  // ...uses buildItem
}, [walletAddress, allAdded, allOwned, allUndeployed, allVisitedSafes, allSafeNames])
```

### Prefer

```ts
const buildItem = useCallback(
  (chainId: string, address: string) =>
    _buildSafeItem(chainId, address, {
      walletAddress,
      allAdded,
      allOwned,
      allUndeployed,
      allVisitedSafes,
      allSafeNames,
    }),
  [walletAddress, allAdded, allOwned, allUndeployed, allVisitedSafes, allSafeNames],
)
// Or move _buildSafeItem to take a single SafeItemDeps object so call sites read as buildItem(chainId, address).
```

### Why

Reviewer flagged six positional args as a refactor smell. The signature obscures which inputs are shared scope vs which actually vary per Safe.

## Hoist regex literals out of loops

Source: PR #7412 (RL-20260312-007)

### Avoid

```ts
const parts = restBytes.split(/(0{18,})/)
for (let i = 0; i < parts.length; i++) {
  const part = parts[i]
  if (!part) continue
  if (/^0+$/.test(part) && part.length >= 18) {
    dimmedZeroes.push(<span className={css.zeroes} key={i}>{part}</span>)
  } else {
    dimmedZeroes.push(<span key={i}>{part}</span>)
  }
}
```

### Prefer

```ts
const ZEROES_ONLY_RE = /^0+$/
const parts = restBytes.split(/(0{18,})/)
for (let i = 0; i < parts.length; i++) {
  const part = parts[i]
  if (!part) continue
  const isDimmed = ZEROES_ONLY_RE.test(part) && part.length >= 18
  dimmedZeroes.push(
    <span className={isDimmed ? css.zeroes : undefined} key={i}>{part}</span>,
  )
}
```

### Why

Allocating the regex once and collapsing the two near-identical JSX branches removes per-iteration allocations on a hot rendering path that previously caused recursion-style stack growth.
