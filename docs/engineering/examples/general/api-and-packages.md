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
