# Engineering Rules

> Generated on demand from `rules.json`. Do not commit; edit `rules.json` and regenerate.

## 📑 Quick Index

| ID | Title | Group |
| --- | --- | --- |
| [`FEAT-01`](#feat-01) | Keep feature boundaries: public API outside, direct imports inside | web / features |
| [`CODE-01`](#code-01) | Extract shared UI only when behavior is actually shared | web / abstractions |
| [`CODE-02`](#code-02) | Extract repeated styling into named structure | web / abstractions |
| [`WEB-01`](#web-01) | Read auth state after hydration and from the backend | web / auth |
| [`API-01`](#api-01) | Search consumers when removing or changing public exports | general / api |
| [`API-02`](#api-02) | Make additive hook registration idempotent | general / api |
| [`API-03`](#api-03) | Do not hand-edit generated clients as durable source | general / api |
| [`RTK-01`](#rtk-01) | Handle RTK mutation results explicitly | general / state |
| [`RTK-02`](#rtk-02) | Choose RTK Query read state by UX meaning | general / state |
| [`DATA-01`](#data-01) | Preserve chain scope in address-like merges | general / data |
| [`DATA-02`](#data-02) | Empty-state checks must include every visible collection | general / data |
| [`DATA-03`](#data-03) | Preserve fallback data when adding new response shapes | general / data |
| [`DATA-04`](#data-04) | Use the canonical helper, predicate, or constant | general / data |
| [`CHAIN-01`](#chain-01) | Resolve contracts from actual deployment data | general / chain |
| [`CHAIN-02`](#chain-02) | Gate multichain UI with compatibility state | web / chain |
| [`STATE-01`](#state-01) | Do not erase session-scoped discoveries on repeat actions | mobile / state |
| [`MOB-01`](#mob-01) | Branch permission UX on real denials; open Settings only on tap | mobile / permissions |
| [`E2E-01`](#e2e-01) | Target test selectors unambiguously | general / e2e |
| [`TEST-01`](#test-01) | Assertions must fail on the regression they claim to cover | general / testing |
| [`TEST-02`](#test-02) | New branch logic needs branch-specific tests | general / testing |
| [`TEST-03`](#test-03) | Test the pure transformation separately from orchestration | general / testing |
| [`TEST-04`](#test-04) | Moved behavior needs replacement coverage and matching mocks | general / testing |
| [`TX-01`](#tx-01) | Preserve immutable transaction identity | web / transactions |
| [`TX-02`](#tx-02) | Submit options must stay switchable | web / transactions |
| [`UX-01`](#ux-01) | Constrained text must truncate or wrap intentionally | web / ui |
| [`UX-02`](#ux-02) | Local rows need local actions | web / ui |
| [`OBS-01`](#obs-01) | Promote telemetry only when user impact justifies it | web / observability |
| [`CACHE-01`](#cache-01) | Cache stable negative lookups deliberately | general / cache |
| [`CI-01`](#ci-01) | Scope CI concurrency and generated labels to the real target | general / ci |
| [`SEC-01`](#sec-01) | Use own-property checks for user-controlled map keys | web / security |
| [`DOC-01`](#doc-01) | Keep docs, comments, and agent guidance true to the code | general / docs |
| [`WEB-04`](#web-04) | Build Safe-scoped navigation from loaded Safe state | web / navigation |
| [`MOB-04`](#mob-04) | Keep Expo route components structural | mobile / navigation |
| [`WEB-05`](#web-05) | Sanitize auth redirects and outcomes | web / auth |
| [`UI-01`](#ui-01) | Use theme tokens and hosted assets | general / ui |
| [`CI-02`](#ci-02) | Release workflows must compute against the pre-change state | general / ci |
| [`MOB-05`](#mob-05) | Configure mobile providers from app state and supported config | mobile / providers |
| [`CONFIG-01`](#config-01) | Add env vars only for new values; match defaults to parsers | web / config |
| [`UX-03`](#ux-03) | Visible behaviour changes are deliberate and confirmed | general / ui |
| [`PKG-01`](#pkg-01) | Do not duplicate shared package files in app source | general / packages |
| [`UI-02`](#ui-02) | Pick z-index from a documented layer scale | web / ui |
| [`REVIEW-01`](#review-01) | Keep each PR to one stated scope | general / review |
| [`STATE-02`](#state-02) | Reset context state when its precondition flips | general / state |
| [`TEST-05`](#test-05) | Pick the right test fixture surface: builders for unit tests, MSW fixtures for integration | web / testing |
| [`CODE-03`](#code-03) | Split multi-job code; close over shared arguments | general / abstractions |
| [`PERF-01`](#perf-01) | Hoist regex literals and stable JSX out of inner loops | general / performance |
| [`CODE-05`](#code-05) | Compute and name derived values before the return | general / abstractions |
| [`FEAT-04`](#feat-04) | Coordinate edits to shared UI primitives with in-flight design-system PRs | web / features |
| [`TX-03`](#tx-03) | Gate submit on readiness of the data that decides it | web / transactions |
| [`NUM-01`](#num-01) | Serialize numbers for on-chain and signing use exactly | general / numerics |
| [`STATE-03`](#state-03) | Async attempts start clean, run once, and recover on every exit | general / state |
| [`MOB-07`](#mob-07) | Mount navigators before running navigation effects | mobile / navigation |
| [`TX-05`](#tx-05) | Centralize transaction-derived analyses in SafeShield | web / transactions |
| [`WEB-06`](#web-06) | Derive reactive parent state from the store, not from child refs | web / state |
| [`MOB-06`](#mob-06) | Forward auto theme to native APIs as null | mobile / theme |
| [`E2E-02`](#e2e-02) | Put E2E timeouts where they take effect | web / e2e |
| [`DATA-06`](#data-06) | Normalize shared identifiers and keys one way | general / data |
| [`CI-03`](#ci-03) | Codegen drift checks must catch untracked outputs and run against PR HEAD | general / ci |
| [`WEB-07`](#web-07) | Handle the loading tri-state of feature-flag hooks | web / auth |
| [`CODE-06`](#code-06) | Own the lifecycle of async work | general / abstractions |
| [`NUM-02`](#num-02) | Validate numeric coercion of external string inputs | general / numerics |
| [`RTK-04`](#rtk-04) | Scope RTK Query cache tags per entity id | general / state |
| [`SEC-02`](#sec-02) | Gate destructive operations on a confirmed cause | general / security |
| [`CI-04`](#ci-04) | Declare least-privilege workflow permissions explicitly | general / ci |
| [`A11Y-01`](#a11y-01) | Keep interactive elements operable, unnested, and truly disabled | web / ui |
| [`SEC-03`](#sec-03) | Allowlist backend-supplied fund recipients before signing | general / security |
| [`TYPE-01`](#type-01) | Keep types honest instead of casting | general / types |
| [`HOOK-01`](#hook-01) | Scope hook dependencies to the real trigger with stable references | general / state |
| [`TEST-06`](#test-06) | Tests must not leak state into other tests | general / testing |
| [`PKG-02`](#pkg-02) | Import only declared dependencies, through their public entrypoint | general / packages |
| [`SEC-04`](#sec-04) | Keep secrets and raw identifiers out of logs and telemetry | general / security |
| [`FORM-01`](#form-01) | Form values track what inputs show and what they depend on | general / forms |
| [`TEST-07`](#test-07) | Visual changes get a Storybook state | web / testing |
| [`PERF-02`](#perf-02) | Bound request fan-out and polling | general / performance |
| [`SEC-05`](#sec-05) | Gate actions on the identity the backend authorizes | general / security |

---

## 🌐 web › features

<a id="feat-01"></a>
### `FEAT-01` Keep feature boundaries: public API outside, direct imports inside

> **web** · features · 4 examples · ↩ `RL-20260225-001` · `RL-20260318-006` · `RL-20260326-001` · `RL-20260605-003` · `RL-20260917-002` · `RL-20260930-010` · `RL-20260227-001` · `RL-20260327-004` · `RL-20260609-003` · `RL-20260805-002` · `RL-20260818-002` · `RL-20260820-005` · `RL-20260911-004` · `RL-20260911-006` · `RL-20260916-002` · `RL-20260220-002` · `RL-20260309-001` · `RL-20260309-005`

**📜 Rule**\
Outside a web feature, use only its public API (barrel, contract, `useLoadFeature` handle), never deep component, hook, service, data, utils, or generated paths; a lint-permitted deep import of a pure helper from a boot path is the exception. Inside a feature, import siblings directly, never the feature's own barrel or lazy handle. A new feature ships that boundary (barrel, contract typed to the component's current props, public types, hooks exported without lazy-loading calls) and owns its flag and availability gating; consumers mount it bare unless the flag also drives their own layout.

**✅ Check**\
> Did this add, expand, or import across or within a feature? If yes, do outside consumers use only its public API, do files inside avoid its own barrel, and does a new feature expose the standard boundary with its gating inside?

<details>
<summary><strong>💡 Example 1 of 4</strong> — <code>web/examples/feature-boundaries.md</code> § <em>feature-public-api</em></summary>

<br>

**feature-public-api**

Use this when one feature needs code from another feature.

Prefer:

```ts
import { SecurityFeature, useSecurityScan } from '@/features/security'
import type { ScanContext } from '@/features/security/types'
```

Avoid:

```ts
import { useSecurityScan } from '@/features/security/hooks/useSecurityScan'
import { SCANNERS } from '@/features/security/data/scanners/registry'
```

Why:

Deep imports couple consumers to internal folders and bypass the feature
architecture boundary. New features should expose the public surface consumers
need before other features depend on them.

<sub>Source: <a href="web/examples/feature-boundaries.md#feature-public-api">web/examples/feature-boundaries.md#feature-public-api</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 4</strong> — <code>web/examples/feature-boundaries.md</code> § <em>place-feature-subfolders-next-to-their-consumers</em></summary>

<br>

**Place feature subfolders next to their consumers**

Source: PR (RL-20260309-001)

### Avoid

```ts
// useCaptchaToken.ts at src/hooks/useCaptchaToken.ts
// captchaHeadersInit.ts at src/services/captchaHeadersInit.ts
// Captcha/index.tsx imports both from far away
```

### Prefer

```ts
// All co-located inside the feature folder:
//   src/components/common/Captcha/
//     CaptchaProvider.tsx
//     useCaptchaToken.ts
//     captchaHeadersInit.ts
//     index.tsx -> export { CaptchaProvider }
import { useCaptchaToken } from './useCaptchaToken'
import { resolveCaptchaReady, sharedTokenRef } from './captchaHeadersInit'
```

### Why

The hook and headers init are only used by CaptchaProvider; keeping them in the Captcha folder makes the feature self-contained and easy to delete or move.

<sub>Source: <a href="web/examples/feature-boundaries.md#place-feature-subfolders-next-to-their-consumers">web/examples/feature-boundaries.md#place-feature-subfolders-next-to-their-consumers</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 4</strong> — <code>web/examples/feature-boundaries.md</code> § <em>use-relative-imports-inside-a-feature-export-only-the-public-surface</em></summary>

<br>

**Use relative imports inside a feature; export only the public surface**

Source: PR (RL-20260309-005)

### Avoid

```ts
// apps/web/src/features/swap/feature.ts (lazy chunk entry)
import SwapButton from './components/SwapButton' // light
import SwapOrder from './components/SwapOrder' // light
import SwapWidget from './components/SwapWidget' // pulls @cowprotocol/widget-react
// Now any useLoadFeature(SwapFeature) call downloads the entire CowSwap bundle

// apps/web/src/features/swap/index.ts (barrel)
export { SWAP_WIDGET_URL } from './components/FallbackSwapWidget' // heavy module

// apps/web/src/features/batching/components/BatchIndicator/index.tsx
import { useDraftBatch } from '@/features/batching' // self-import
```

### Prefer

```ts
// Split the lazy contract: lightweight components in one chunk,
// heavy widget in a separate dynamic import.
// Move plain constants out of heavy modules:
//   apps/web/src/features/swap/constants.ts
export const SWAP_WIDGET_URL = 'https://swap.cow.fi/...'
// Then re-export from the barrel safely.

// In-feature imports stay relative:
import { useDraftBatch } from '../hooks/useDraftBatch'
import { addTx, removeTx } from '../store/batchSlice'
```

### Why

Bundling a heavy widget alongside lightweight feature components forces every consumer of the feature contract to download the heavy module, defeating the lazy-loading goal. Self-imports through the barrel create circular deps and confuse test setups.

<sub>Source: <a href="web/examples/feature-boundaries.md#use-relative-imports-inside-a-feature-export-only-the-public-surface">web/examples/feature-boundaries.md#use-relative-imports-inside-a-feature-export-only-the-public-surface</a></sub>

</details>

<details>
<summary><strong>💡 Example 4 of 4</strong> — <code>web/examples/feature-boundaries.md</code> § <em>sibling-files-inside-a-feature-use-relative-imports</em></summary>

<br>

**Sibling files inside a feature use relative imports**

Source: PR (RL-20260220-002)

### Avoid

```ts
// apps/web/src/features/spaces/utils.ts
import { MemberStatus, MemberRole } from '@/features/spaces' // self-imports the barrel

// apps/web/src/features/spaces/hooks/useSpaceMembers.tsx
import { useCurrentSpaceId } from '@/features/spaces'
```

### Prefer

```ts
// apps/web/src/features/spaces/utils.ts
import { MemberStatus, MemberRole } from './hooks/useSpaceMembers'

// apps/web/src/features/spaces/hooks/useSpaceMembers.tsx
import { useCurrentSpaceId } from './useCurrentSpaceId'
```

### Why

External callers go through the public barrel; internals stay relative. Self-importing the barrel from inside the feature creates module cycles that survive tree-shaking but blow up under different bundlers, mocking systems, and re-export reordering.

<sub>Source: <a href="web/examples/feature-boundaries.md#sibling-files-inside-a-feature-use-relative-imports">web/examples/feature-boundaries.md#sibling-files-inside-a-feature-use-relative-imports</a></sub>

</details>

---

## 🌐 web › abstractions

<a id="code-01"></a>
### `CODE-01` Extract shared UI only when behavior is actually shared

> **web** · abstractions · 4 examples · ↩ `RL-20260227-002` · `RL-20260318-011` · `RL-20260327-006` · `RL-20260331-006` · `RL-20260505-006` · `RL-20260505-011` · `RL-20260605-007` · `RL-20260611-004` · `RL-20260610-002` · `RL-20260622-001` · `RL-20260624-001` · `RL-20260701-003` · `RL-20260709-001` · `RL-20260716-001` · `RL-20260722-001` · `RL-20260731-002` · `RL-20260806-004` · `RL-20260828-003` · `RL-20260911-003` · `RL-20260916-004` · `RL-20260930-002` · `RL-20261008-003` · `RL-20261009-004`

**📜 Rule**\
When two components share form, state, loading, and error flow, prefer one configurable component over near-duplicate implementations. Logic copied between call sites or between web and mobile moves once into a shared hook or `packages/utils`, and a helper peer modules share gets its own module rather than one peer importing it from another.

**✅ Check**\
> Did this add a component that mirrors an existing workflow, or logic another call site or app already has? If yes, can the existing component accept the small differences as props, or the logic move into a shared hook, package, or its own module?

<details>
<summary><strong>💡 Example 1 of 4</strong> — <code>web/examples/feature-boundaries.md</code> § <em>shared-form-components</em></summary>

<br>

**shared-form-components**

Use this when a new dialog repeats an existing form flow with only labels or
mutation details changed.

Prefer:

```tsx
<ContactDialog label="Add private contact" description="Only visible to you" onSubmit={upsertPrivateContact} />
```

Avoid:

```tsx
export const AddPrivateContact = () => {
  // Copied form layout, field state, validation, loading, and error handling
  // from AddContact with only the mutation and label changed.
}
```

Why:

Copying the whole form doubles future validation, loading, and error handling
maintenance for what is really one workflow.

<sub>Source: <a href="web/examples/feature-boundaries.md#shared-form-components">web/examples/feature-boundaries.md#shared-form-components</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 4</strong> — <code>web/examples/feature-boundaries.md</code> § <em>code-01-fold-near-duplicate-sign-in-buttons-into-one-configurable-component</em></summary>

<br>

**CODE-01 — Fold near-duplicate sign-in buttons into one configurable component**

Source: PR #7531 (RL-20260327-006)

### Avoid

```tsx
function EmailSignInButton() {
  const { loginWithRedirect } = useAuthLogin()
  if (!useHasFeature(FEATURES.AUTH)) return null
  const onClick = () => {
    trackEvent(AUTH_EVENTS.EMAIL)
    loginWithRedirect(Connection.Email)
  }
  return (
    <Button startIcon={<EmailIcon />} onClick={onClick} data-testid="email-signin">
      Continue with email
    </Button>
  )
}

function GoogleSignInButton() {
  const { loginWithRedirect } = useAuthLogin()
  if (!useHasFeature(FEATURES.AUTH)) return null
  const onClick = () => {
    trackEvent(AUTH_EVENTS.GOOGLE)
    loginWithRedirect(Connection.Google)
  }
  return (
    <Button startIcon={<GoogleIcon />} onClick={onClick} data-testid="google-signin">
      Continue with Google
    </Button>
  )
}
```

### Prefer

```tsx
type OidcSignInButtonProps = {
  connection: OidcConnection
  label: string
  icon: ReactNode
  analyticsEvent: EventType
  testId: string
}

const OidcSignInButton = ({ connection, label, icon, analyticsEvent, testId }: OidcSignInButtonProps) => {
  const { loginWithRedirect } = useAuthLogin()
  if (!useHasFeature(FEATURES.AUTH)) return null
  const handleClick = () => {
    trackEvent(analyticsEvent)
    loginWithRedirect(connection)
  }
  return (
    <Button fullWidth startIcon={icon} onClick={handleClick} data-testid={testId}>
      {label}
    </Button>
  )
}
```

### Why

Two buttons that differ only in label, icon, connection enum, analytics event,
and test ID duplicate the feature-flag check and login-redirect wiring. Pulling
the differences into props keeps the auth flow in one place and makes it
impossible for the buttons to drift on flag handling or analytics.

<sub>Source: <a href="web/examples/feature-boundaries.md#code-01-fold-near-duplicate-sign-in-buttons-into-one-configurable-component">web/examples/feature-boundaries.md#code-01-fold-near-duplicate-sign-in-buttons-into-one-configurable-component</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 4</strong> — <code>web/examples/feature-boundaries.md</code> § <em>code-01-extract-embedded-error-boundaries-from-unrelated-ui-components</em></summary>

<br>

**CODE-01 — Extract embedded error boundaries from unrelated UI components**

Source: PR #7558 (RL-20260331-006)

### Avoid

```tsx
// inside StatusBadge.tsx
class BadgeErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export function StatusBadge({ children }: Props) {
  return (
    <BadgeErrorBoundary>
      <Badge>{children}</Badge>
    </BadgeErrorBoundary>
  )
}
```

### Prefer

```tsx
// in its own file: components/common/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

// StatusBadge.tsx imports it
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
export function StatusBadge({ children }: Props) {
  return (
    <ErrorBoundary>
      <Badge>{children}</Badge>
    </ErrorBoundary>
  )
}
```

### Why

An error boundary is a cross-cutting concern — other components will need it
too. Colocating the class inside one specific UI component muddies that
component's responsibility and forces every future consumer to either duplicate
the class or reach into a sibling's file.

<sub>Source: <a href="web/examples/feature-boundaries.md#code-01-extract-embedded-error-boundaries-from-unrelated-ui-components">web/examples/feature-boundaries.md#code-01-extract-embedded-error-boundaries-from-unrelated-ui-components</a></sub>

</details>

<details>
<summary><strong>💡 Example 4 of 4</strong> — <code>examples/general/api-and-packages.md</code> § <em>code-01-compare-severities-through-a-named-helper</em></summary>

<br>

**CODE-01 — Compare severities through a named helper**

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

<sub>Source: <a href="examples/general/api-and-packages.md#code-01-compare-severities-through-a-named-helper">examples/general/api-and-packages.md#code-01-compare-severities-through-a-named-helper</a></sub>

</details>

---

<a id="code-02"></a>
### `CODE-02` Extract repeated styling into named structure

> **web** · abstractions · 3 examples · ↩ `RL-20260316-001` · `RL-20260318-003` · `RL-20260413-003` · `RL-20260424-001` · `RL-20260608-002` · `RL-20260612-009` · `RL-20260623-001` · `RL-20260806-007` · `RL-20261013-004`

**📜 Rule**\
Repeated or long styling or wrapper-markup patterns should move into a small component, class helper, or CSS module when that makes call sites readable and consistent.

**✅ Check**\
> Did this repeat a long class list, shadow, layout, or wrapper-markup pattern? If yes, should it be named once and reused?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>web/examples/feature-boundaries.md</code> § <em>repeated-style-shape</em></summary>

<br>

**repeated-style-shape**

Use this when several controls repeat the same visual wrapper or a JSX line
collects a long responsive class list.

Prefer:

```tsx
const topbarControlClass = 'relative flex self-stretch items-stretch rounded-lg bg-card shadow-topbar'

return <div className={topbarControlClass}>{children}</div>
```

Avoid:

```tsx
return (
  <div className="relative flex self-stretch items-stretch rounded-lg bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
    {children}
  </div>
)
```

Why:

Named structure makes repeated visual decisions easier to keep consistent and
keeps component bodies focused on behavior.

<sub>Source: <a href="web/examples/feature-boundaries.md#repeated-style-shape">web/examples/feature-boundaries.md#repeated-style-shape</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 3</strong> — <code>web/examples/feature-boundaries.md</code> § <em>code-02-move-heavy-tailwind-class-strings-into-css-modules</em></summary>

<br>

**CODE-02 — Move heavy Tailwind class strings into CSS modules**

Source: PR #7454 (RL-20260318-003)

### Avoid

```ts
<div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
```

### Prefer

```ts
// styles.module.css owns the scrollbar/overflow chain, JSX stays readable
<div className={css.scrollableSafesList}>
```

### Why

Inline class strings with arbitrary values and pseudo-element variants are unreviewable and impossible to reuse. Naming the structure in a CSS module makes intent obvious and the rule reusable.

<sub>Source: <a href="web/examples/feature-boundaries.md#code-02-move-heavy-tailwind-class-strings-into-css-modules">web/examples/feature-boundaries.md#code-02-move-heavy-tailwind-class-strings-into-css-modules</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 3</strong> — <code>web/examples/feature-boundaries.md</code> § <em>consolidate-per-element-tailwind-into-the-css-module-class</em></summary>

<br>

**Consolidate per-element Tailwind into the CSS module class**

Source: PR #7429 (RL-20260316-001)

### Avoid

```ts
<AvatarFallback
  className="rounded-md text-primary-foreground text-xs"
  style={{ backgroundColor: getAvatarColor(space.id) }}
/>
```

### Prefer

```ts
<AvatarFallback
  className={cn('text-primary-foreground text-xs', css.spaceSelectorItemAvatarFallback)}
/>
// In .module.css, put rounded-md + the dynamic background-color via a CSS var
// .spaceSelectorItemAvatarFallback { border-radius: var(--radius-md); background: var(--avatar-color); }
```

### Why

Splitting the visual definition between a CSS module class and a sibling Tailwind/inline list re-introduces the divergence the module was meant to remove. Reviewers pushed back on shipping both surfaces side-by-side.

<sub>Source: <a href="web/examples/feature-boundaries.md#consolidate-per-element-tailwind-into-the-css-module-class">web/examples/feature-boundaries.md#consolidate-per-element-tailwind-into-the-css-module-class</a></sub>

</details>

---

## 🌐 web › auth

<a id="web-01"></a>
### `WEB-01` Read auth state after hydration and from the backend

> **web** · auth · 4 examples · ↩ `RL-20260420-002` · `RL-20260504-001` · `RL-20260506-002` · `RL-20260520-001` · `RL-20260506-004` · `RL-20260324-001` · `RL-20260407-005` · `RL-20260413-001`

**📜 Rule**\
Effects that read persisted auth/session state depend on hydration or the hydrated value, not the initial empty state. Login, logout, and callback reconciliation mark the client authenticated only after a fresh backend probe (no cached RTK data or lingering subscription) and treat a transient reconcile error as unauthenticated. Logout clears client auth before navigating, or suppresses session-expired handling while it runs.

**✅ Check**\
> Did this read persisted auth state, handle a login/logout/callback transition, or change credentialed 403 handling? If yes, does it wait for hydration, probe the backend fresh, end unauthenticated on reconcile errors, and keep a deliberate logout from showing a session-expired toast?

<details>
<summary><strong>💡 Example 1 of 4</strong> — <code>examples/general/gateway-hooks.md</code> § <em>hydration-aware-effects</em></summary>

<br>

**hydration-aware-effects**

Use this when an effect reads auth state that can be rehydrated from persisted
Redux state.

Prefer:

```ts
useEffect(() => {
  if (!isStoreHydrated) return
  if (isExpired(sessionExpiresAt)) {
    dispatch(sessionExpired())
  }
}, [dispatch, isStoreHydrated, sessionExpiresAt])
```

Avoid:

```ts
useEffect(() => {
  if (isExpired(sessionExpiresAt)) {
    dispatch(sessionExpired())
  }
}, [])
```

Why:

The mount closure can capture initial empty auth state before hydration and
never observe the persisted expired session.

<sub>Source: <a href="examples/general/gateway-hooks.md#hydration-aware-effects">examples/general/gateway-hooks.md#hydration-aware-effects</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 4</strong> — <code>examples/general/gateway-hooks.md</code> § <em>logout-session-races</em></summary>

<br>

**logout-session-races**

Use this when logout navigates through a full-page redirect while global
credentialed-response hooks are active.

Prefer:

```ts
const logout = () => {
  dispatch(setUnauthenticated())
  sessionStorage.setItem(LOGGING_OUT_KEY, '1')
  form.submit()
}
```

Avoid:

```ts
const logout = () => {
  sessionStorage.setItem(LOGGING_OUT_KEY, '1')
  form.submit()
}
```

Why:

After backend logout clears the cookie, hydrated client auth can still look
valid long enough for credentialed queries to 403 and show a misleading
session-expired toast.

<sub>Source: <a href="examples/general/gateway-hooks.md#logout-session-races">examples/general/gateway-hooks.md#logout-session-races</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 4</strong> — <code>examples/general/gateway-hooks.md</code> § <em>fresh-auth-probes</em></summary>

<br>

**fresh-auth-probes**

Use this when login/logout callbacks need to reconcile backend cookie state.

Prefer:

```ts
const result = await dispatch(
  authGetMeV1.initiate(undefined, {
    forceRefetch: true,
    subscribe: false,
  }),
)
```

Avoid:

```ts
const result = await dispatch(authGetMeV1.initiate())
```

Why:

Auth transitions are about current backend cookie state. Cached RTK Query data
can keep a previous authenticated result alive after logout or before a new
login is fully established.

<sub>Source: <a href="examples/general/gateway-hooks.md#fresh-auth-probes">examples/general/gateway-hooks.md#fresh-auth-probes</a></sub>

</details>

<details>
<summary><strong>💡 Example 4 of 4</strong> — <code>examples/general/gateway-hooks.md</code> § <em>web-01-force-unauthenticated-on-transient-reconcile-errors</em></summary>

<br>

**WEB-01 — Force unauthenticated on transient reconcile errors**

Source: PR #7560 (RL-20260407-005)

### Avoid

```ts
const result = await reconcileAuth(dispatch)

if (result === 'error' || result === 'authenticated') {
  logError(Errors._109)
}
sessionStorage.removeItem(LOGGING_OUT_KEY)
```

### Prefer

```ts
const result = await reconcileAuth(dispatch)

if (result !== 'unauthenticated') {
  logError(Errors._109)
}

if (result === 'error' || result === 'authenticated') {
  dispatch(setUnauthenticated())
}
sessionStorage.removeItem(LOGGING_OUT_KEY)
```

### Why

If the post-logout reconciliation request fails transiently (5xx, network),
only logging the error and clearing the in-progress flag leaves Redux marked
authenticated forever; route guards then keep the UI in a signed-in state
with no retry. Treat a transient reconcile error the same as the
`authenticated` outcome on the deliberate-logout path: force the user to
unauthenticated so they re-login.

<sub>Source: <a href="examples/general/gateway-hooks.md#web-01-force-unauthenticated-on-transient-reconcile-errors">examples/general/gateway-hooks.md#web-01-force-unauthenticated-on-transient-reconcile-errors</a></sub>

</details>

---

## 🌐 general › api

<a id="api-01"></a>
### `API-01` Search consumers when removing or changing public exports

> **general** · api · 1 example · ↩ `RL-20260410-002` · `RL-20260428-003` · `RL-20260506-003` · `RL-20260611-009` · `RL-20260625-001` · `RL-20260702-006` · `RL-20260805-003` · `RL-20260820-007` · `RL-20260921-002` · `RL-20260930-009` · `RL-20260929-005` · `RL-20261008-008` · `RL-20261009-003` · `RL-20261014-003`

**📜 Rule**\
Removing or changing a public export, hook return field, endpoint, compatibility API, URL-served asset, or visible copy that tests assert requires updating all tests, E2E helpers, and consumers in the same change. Every prop, field, export, or branch a change adds has a consumer that can reach it; dead code is deleted, not commented out.

**✅ Check**\
> Did this remove, rename, or change what an exported API or shared hook returns, or move a URL-served asset? If yes, were tests, namespace imports, dynamic access, generated consumers, and downstream apps searched, does each consumer's gating purpose still hold, and does everything the change adds have a reachable consumer?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/api-and-packages.md</code> § <em>api-01-drop-in-replacements-preserve-the-original-prop-surface</em></summary>

<br>

**API-01 — Drop-in replacements preserve the original prop surface**

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

<sub>Source: <a href="examples/general/api-and-packages.md#api-01-drop-in-replacements-preserve-the-original-prop-surface">examples/general/api-and-packages.md#api-01-drop-in-replacements-preserve-the-original-prop-surface</a></sub>

</details>

---

<a id="api-02"></a>
### `API-02` Make additive hook registration idempotent

> **general** · api · 1 example · ↩ `RL-20260506-005` · `RL-20260624-009`

**📜 Rule**\
Initializers that append global hooks must be idempotent or retain and call the deregister callback before re-registering.

**✅ Check**\
> Did this replace a setter with an additive hook API or register a global hook? If yes, is repeated initialization safe?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/gateway-hooks.md</code> § <em>idempotent-response-hooks</em></summary>

<br>

**idempotent-response-hooks**

Use this when an initializer registers a global response hook.

Prefer:

```ts
let deregister: (() => void) | null = null

export const initializeGatewayHook = () => {
  deregister?.()
  deregister = addHandleResponseHook(handleResponse)
}
```

Also acceptable:

```ts
let initialized = false

export const initializeGatewayHook = () => {
  if (initialized) return
  initialized = true
  addHandleResponseHook(handleResponse)
}
```

Avoid:

```ts
export const initializeGatewayHook = () => {
  addHandleResponseHook(handleResponse)
}
```

Why:

Setter-style APIs were implicitly idempotent. Append-style hook APIs accumulate
callbacks across repeated initialization unless callers guard or deregister.

<sub>Source: <a href="examples/general/gateway-hooks.md#idempotent-response-hooks">examples/general/gateway-hooks.md#idempotent-response-hooks</a></sub>

</details>

---

<a id="api-03"></a>
### `API-03` Do not hand-edit generated clients as durable source

> **general** · api · 2 examples · ↩ `RL-20260219-001` · `RL-20260219-004` · `RL-20260415-008` · `RL-20260603-001` · `RL-20260615-002` · `RL-20260609-006` · `RL-20260728-001`

**📜 Rule**\
Generated gateway files must come from schema/codegen. Temporary hand edits need an explicit generator path or they will be overwritten; a hotfix may pin the production shape by hand when regenerating would pull unreleased schema, if the PR says so. Once codegen covers an endpoint, migrate consumers to the generated hooks/types and delete the hand-written module in the same change.

**✅ Check**\
> Did this touch AUTO_GENERATED or schema-derived files? If yes, can codegen reproduce the change, and is any hand-written module for a now-generated endpoint deleted?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/api-and-packages.md</code> § <em>api-03-import-from-package-public-entrypoints-not-deep-dist-paths</em></summary>

<br>

**API-03 — Import from package public entrypoints, not deep dist paths**

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

<sub>Source: <a href="examples/general/api-and-packages.md#api-03-import-from-package-public-entrypoints-not-deep-dist-paths">examples/general/api-and-packages.md#api-03-import-from-package-public-entrypoints-not-deep-dist-paths</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/api-and-packages.md</code> § <em>treat-autogenerated-clients-as-derived-output</em></summary>

<br>

**Treat AUTO_GENERATED clients as derived output**

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

<sub>Source: <a href="examples/general/api-and-packages.md#treat-autogenerated-clients-as-derived-output">examples/general/api-and-packages.md#treat-autogenerated-clients-as-derived-output</a></sub>

</details>

---

## 🌐 general › state

<a id="rtk-01"></a>
### `RTK-01` Handle RTK mutation results explicitly

> **general** · state · 2 examples · ↩ `RL-20260407-004` · `RL-20260505-004` · `RL-20260527-001` · `RL-20260611-001` · `RL-20260909-007` · `RL-20260925-003`

**📜 Rule**\
RTK mutation triggers resolve with a result object: `.unwrap()` or check `result.error` before showing success or updating local state. Until the post-mutation refetch settles the cache still holds the old value, so derive `dirty`/can-submit from a local saved baseline or an `awaitingCacheSync` flag, not the cache, or a duplicate submit re-enables.

**✅ Check**\
> Did this call an RTK mutation? If yes, does success state happen only after confirmed success, and is derived dirty/can-submit state protected from re-enabling during the post-mutation refetch window?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>rtk-mutation-results</em></summary>

<br>

**rtk-mutation-results**

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

<sub>Source: <a href="examples/general/data-integrity.md#rtk-mutation-results">examples/general/data-integrity.md#rtk-mutation-results</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/gateway-hooks.md</code> § <em>rtk-01-unwrap-mutations-before-mutating-state-on-success</em></summary>

<br>

**RTK-01 — Unwrap mutations before mutating state on success**

Source: PR #7560 (RL-20260407-004)

### Avoid

```ts
await entityApi.endpoints.processFn.initiate(args)
dispatch(setEntityProcessed())
```

### Prefer

```ts
try {
  await entityApi.endpoints.processFn.initiate(args).unwrap()
  dispatch(setEntityProcessed())
} catch {
  logError(Errors._109)
}
```

### Why

Awaiting an RTK Query mutation does not throw on HTTP/API failures unless
`.unwrap()` is used. Without it, the success-path `dispatch` runs even when
the backend rejected the request, desynchronising client state from server
state and skipping the `catch` branch that would surface or recover from the
failure.

<sub>Source: <a href="examples/general/gateway-hooks.md#rtk-01-unwrap-mutations-before-mutating-state-on-success">examples/general/gateway-hooks.md#rtk-01-unwrap-mutations-before-mutating-state-on-success</a></sub>

</details>

---

<a id="rtk-02"></a>
### `RTK-02` Choose RTK Query read state by UX meaning

> **general** · state · 2 examples · ↩ `RL-20260302-005` · `RL-20260415-006` · `RL-20260420-001` · `RL-20260615-001` · `RL-20260615-010` · `RL-20260609-010` · `RL-20260930-003`

**📜 Rule**\
Pick the flag by whether existing data should stay visible: `isLoading` is the first load only, `isFetching` includes refetches, and a load-more control stays mounted and disabled while the next page fetches. A failed refetch keeps the last `data`: access-derived hooks drop it on 403/404, other errors keep it as transient. A new arg's load shows as `currentData === undefined` (`isLoading` stays false), and a failed dependency query renders as an error, not as empty.

**✅ Check**\
> Did this render from RTK Query state? If yes, does a refetch hide content only when it should, can a failed refetch leave stale or forbidden data on screen, and can an arg change or failed dependency read as a confident empty answer?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>loading-vs-fetching</em></summary>

<br>

**loading-vs-fetching**

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

<sub>Source: <a href="examples/general/data-integrity.md#loading-vs-fetching">examples/general/data-integrity.md#loading-vs-fetching</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>rtk-02-skip-queries-until-the-resource-id-is-resolved</em></summary>

<br>

**RTK-02 — Skip queries until the resource ID is resolved**

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

<sub>Source: <a href="examples/general/data-integrity.md#rtk-02-skip-queries-until-the-resource-id-is-resolved">examples/general/data-integrity.md#rtk-02-skip-queries-until-the-resource-id-is-resolved</a></sub>

</details>

---

## 🌐 general › data

<a id="data-01"></a>
### `DATA-01` Preserve chain scope in address-like merges

> **general** · data · 2 examples · ↩ `RL-20260223-001` · `RL-20260313-010` · `RL-20260323-001` · `RL-20260415-003` · `RL-20260505-002` · `RL-20260505-005` · `RL-20260720-004` · `RL-20260909-006` · `RL-20260922-001`

**📜 Rule**\
Address-book and Safe-like merge logic must compare entries at the relevant identity granularity, usually address plus chain ID.

**✅ Check**\
> Did this merge contacts, Safes, or address-scoped records? If yes, are non-overlapping chain IDs preserved?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>per-chain-contact-merges</em></summary>

<br>

**per-chain-contact-merges**

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

<sub>Source: <a href="examples/general/data-integrity.md#per-chain-contact-merges">examples/general/data-integrity.md#per-chain-contact-merges</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>compare-addresses-through-sameaddress</em></summary>

<br>

**Compare addresses through sameAddress**

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

<sub>Source: <a href="examples/general/data-integrity.md#compare-addresses-through-sameaddress">examples/general/data-integrity.md#compare-addresses-through-sameaddress</a></sub>

</details>

---

<a id="data-02"></a>
### `DATA-02` Empty-state checks must include every visible collection

> **general** · data · 2 examples · ↩ `RL-20260320-001` · `RL-20260415-002` · `RL-20260505-003`

**📜 Rule**\
UI empty-state predicates must include every collection that can render tabs, rows, actions, or badges.

**✅ Check**\
> Did this add a new collection to a view? If yes, do empty states and tab visibility include it?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>data-02-empty-state-gating-across-multiple-collections</em></summary>

<br>

**DATA-02 — Empty-state gating across multiple collections**

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

<sub>Source: <a href="examples/general/data-integrity.md#data-02-empty-state-gating-across-multiple-collections">examples/general/data-integrity.md#data-02-empty-state-gating-across-multiple-collections</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>data-02-hide-native-token-without-erasing-aggregator-balances</em></summary>

<br>

**DATA-02 — Hide native token without erasing aggregator balances**

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

<sub>Source: <a href="examples/general/data-integrity.md#data-02-hide-native-token-without-erasing-aggregator-balances">examples/general/data-integrity.md#data-02-hide-native-token-without-erasing-aggregator-balances</a></sub>

</details>

---

<a id="data-03"></a>
### `DATA-03` Preserve fallback data when adding new response shapes

> **general** · data · 3 examples · ↩ `RL-20260310-011` · `RL-20260318-009` · `RL-20260409-001` · `RL-20260522-004` · `RL-20260526-002` · `RL-20260612-005` · `RL-20260610-003` · `RL-20260609-009`

**📜 Rule**\
When upstream responses gain a new shape, merge field-by-field and preserve legacy fallback mappings for omitted optional sections, unless a cutover documented in the PR drops the legacy shape deliberately. Fallback/degraded results carry the same mode flags as the success branch.

**✅ Check**\
> Did this add support for a new response shape? If yes, do partial new payloads still preserve legacy data?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>examples/general/data-integrity.md</code> § <em>fallback-preserving-maps</em></summary>

<br>

**fallback-preserving-maps**

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

<sub>Source: <a href="examples/general/data-integrity.md#fallback-preserving-maps">examples/general/data-integrity.md#fallback-preserving-maps</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 3</strong> — <code>examples/general/data-integrity.md</code> § <em>data-03-drop-analysis-results-when-their-fetch-errored</em></summary>

<br>

**DATA-03 — Drop analysis results when their fetch errored**

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

<sub>Source: <a href="examples/general/data-integrity.md#data-03-drop-analysis-results-when-their-fetch-errored">examples/general/data-integrity.md#data-03-drop-analysis-results-when-their-fetch-errored</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 3</strong> — <code>examples/general/data-integrity.md</code> § <em>three-state-portfolio-fallback-known-empty-vs-unknown-vs-errored</em></summary>

<br>

**Three-state portfolio fallback: known-empty vs unknown vs errored**

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

<sub>Source: <a href="examples/general/data-integrity.md#three-state-portfolio-fallback-known-empty-vs-unknown-vs-errored">examples/general/data-integrity.md#three-state-portfolio-fallback-known-empty-vs-unknown-vs-errored</a></sub>

</details>

---

<a id="data-04"></a>
### `DATA-04` Use the canonical helper, predicate, or constant

> **general** · data · 3 examples · ↩ `RL-20260220-003` · `RL-20260331-002` · `RL-20260402-002` · `RL-20260416-001` · `RL-20260423-001` · `RL-20260605-012` · `RL-20260604-003` · `RL-20260608-007` · `RL-20260615-004` · `RL-20260612-004` · `RL-20260619-001` · `RL-20260713-004` · `RL-20260722-002` · `RL-20260812-001` · `RL-20260930-001` · `RL-20261008-002` · `RL-20261014-001`

**📜 Rule**\
Before adding a helper, constant, or route builder, search for the existing one (lodash `uniqWith`/`chunk`, shared formatters, `ROUTES`, E2E `TEST_ADDRESSES`/`CHAIN_IDS`) and use it; E2E helpers take hosts from the configured `baseURL`. Bounded or formatted values (tx origin, Safe version, `chainId:address`) go through their helper, not raw serialization or parsing. Domain classifications call the canonical predicate, never an inline copy or a field-presence check that legacy defaults (zero address, 0) fool, and every consumer of a shared check (submit gate, builder, summary) calls the same one. A call site that must bypass a helper keeps its fallbacks.

**✅ Check**\
> Did this add a helper or constant, hardcode a test address, chain ID, or host, or create, parse, or classify a formatted value or domain state? If yes, does an existing helper, constant, or predicate already do it, and does any call site that bypasses one keep its fallbacks?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>examples/general/chain-contracts.md</code> § <em>normalize-versions-and-origin</em></summary>

<br>

**normalize-versions-and-origin**

Prefer:

```ts
const safeVersion = getSafeVersion(version)
const txOrigin = getTxOrigin({ name: '', url: window.location.origin })
```

Avoid:

```ts
const safeVersion = version ?? '1.3.0'
const txOrigin = JSON.stringify({ name: '', url: window.location.origin })
```

Why:

Safe versions can include metadata such as `+L2`, and transaction origins have
length limits. Use the existing normalization helpers before lookup or encoding.

<sub>Source: <a href="examples/general/chain-contracts.md#normalize-versions-and-origin">examples/general/chain-contracts.md#normalize-versions-and-origin</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 3</strong> — <code>examples/general/testing.md</code> § <em>match-real-gateway-response-shapes-when-intercepting</em></summary>

<br>

**Match real gateway response shapes when intercepting**

Source: PR (RL-20260220-003)

### Avoid

```ts
// constants.js
export const chainConfigEndpoint = '**/v1/chains/*' // never matches the paginated /v1/chains call

// page object
cy.intercept('GET', constants.chainConfigEndpoint, (req) => {
  req.continue((res) => {
    if (res.body?.features) res.body.features.push(featureName) // top-level features doesn't exist
  })
})
```

### Prefer

```ts
export const chainsListEndpoint = '**/v1/chains?**'

cy.intercept('GET', constants.chainsListEndpoint, (req) => {
  req.continue((res) => {
    res.body.results = res.body.results?.map((chain) => ({
      ...chain,
      features: chain.features.includes(featureName) ? chain.features : [...chain.features, featureName],
    }))
  })
})
```

### Why

If the URL pattern doesn't match the real call, or the mutated path doesn't exist on the response, the interceptor is a silent no-op and the test still depends on live backend state — the very thing the mock is supposed to remove.

<sub>Source: <a href="examples/general/testing.md#match-real-gateway-response-shapes-when-intercepting">examples/general/testing.md#match-real-gateway-response-shapes-when-intercepting</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 3</strong> — <code>examples/general/testing.md</code> § <em>data-04-read-e2e-test-data-and-hosts-from-shared-sources</em></summary>

<br>

**DATA-04 — Read E2E test data and hosts from shared sources**

Source: PR #9075, #9065 (RL-20261014-001)

### Avoid

```ts
const SEPOLIA = '11155111'
const CONTACT = { name: 'Treasury contact', address: '0x1111111111111111111111111111111111111111' }

await page.waitForURL((url) => url.hostname === 'localhost' && !url.pathname.startsWith('/cgw'))
```

### Prefer

```ts
import { CHAIN_IDS, TEST_ADDRESSES } from '../../src/data/constants'

const SEPOLIA = CHAIN_IDS.sepolia
const CONTACT = { name: 'Treasury contact', address: TEST_ADDRESSES.NON_OWNER }

const { baseURL } = test.info().project.use
if (!baseURL) throw new Error('signInWithEmail needs the baseURL of the wallet')
await page.waitForURL((url) => url.origin === new URL(baseURL).origin)
```

### Why

A change to the shared test data reaches every spec only when the specs import it. A run whose wallet URL points at `127.0.0.1` or another port never matches a hardcoded `localhost`, so the wait times out before the test checks anything; the configured `baseURL` is the one source of the wallet's origin.

<sub>Source: <a href="examples/general/testing.md#data-04-read-e2e-test-data-and-hosts-from-shared-sources">examples/general/testing.md#data-04-read-e2e-test-data-and-hosts-from-shared-sources</a></sub>

</details>

---

## 🌐 general › chain

<a id="chain-01"></a>
### `CHAIN-01` Resolve contracts from actual deployment data

> **general** · chain · 1 example · ↩ `RL-20260423-001` · `RL-20260423-002` · `RL-20260428-001` · `RL-20260624-007` · `RL-20260727-002` · `RL-20260730-002` · `RL-20260811-001` · `RL-20260218-003` · `RL-20260727-001`

**📜 Rule**\
Contract and chain compatibility logic derives from Safe version, master copy, chain ID, and safe-deployments data rather than broad chain flags or naive set differences. Version-dependent lookups go through chain-aware helpers that use the chain's recommended version and canonical-fallback order, never a global latest version or a hard-coded index.

**✅ Check**\
> Did this choose a contract address, Safe version, or available chain? If yes, is it based on actual deployment data and the chain's own recommended version, and covered for both web and mobile callers?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/chain-contracts.md</code> § <em>deployment-data-not-chain-flags</em></summary>

<br>

**deployment-data-not-chain-flags**

Prefer:

```ts
const deployment = getDeploymentTypeForMasterCopy({
  chainId,
  implementation,
  version: getSafeVersion(version),
})

return resolveChainAgnosticContractAddresses({
  chainId,
  deploymentType: deployment.type,
})
```

Avoid:

```ts
return resolveChainAgnosticContractAddresses({
  isZk: chain.features.includes('zk'),
})
```

Why:

Chain-level flags are too coarse. A Safe's master copy can disagree with the
chain's broad `zk` or `l2` label, and contract addresses must match the actual
registered deployment for that chain and Safe version.

<sub>Source: <a href="examples/general/chain-contracts.md#deployment-data-not-chain-flags">examples/general/chain-contracts.md#deployment-data-not-chain-flags</a></sub>

</details>

---

## 🌐 web › chain

<a id="chain-02"></a>
### `CHAIN-02` Gate multichain UI with compatibility state

> **web** · chain · 1 example · ↩ `RL-20260402-001` · `RL-20260428-001` · `RL-20260428-002` · `RL-20260731-004`

**📜 Rule**\
Multichain UI should show only compatible actions, with explicit unavailable/loading/empty states, instead of letting users click into silent failures.

**✅ Check**\
> Did this expose add-network or multichain actions? If yes, are compatibility, loading, unavailable, and empty states explicit and tested?

<details>
<summary><strong>💡 Example</strong> — <code>web/examples/feature-boundaries.md</code> § <em>multichain-compatibility-state</em></summary>

<br>

**multichain-compatibility-state**

Use this when a UI lists chains where a Safe can be added or acted on.

Prefer:

```ts
const state = useAddNetworkState(safeAddress, deployedChainIds)

if (!state.isFeatureEnabled) return null
if (state.unavailableReason) return <Unavailable reason={state.unavailableReason} />
if (state.loading) return <Spinner />

return <ChainRows networks={state.availableNetworks} />
```

Avoid:

```ts
const availableChains = chains.filter((chain) => !deployedChainIds.includes(chain.chainId))
```

Why:

Naive set differences show chains that may be incompatible with the Safe's
master copy, deployment type, or product feature flags. Users should see the
compatibility result before they click into a broken flow.

<sub>Source: <a href="web/examples/feature-boundaries.md#multichain-compatibility-state">web/examples/feature-boundaries.md#multichain-compatibility-state</a></sub>

</details>

---

## 🌐 mobile › state

<a id="state-01"></a>
### `STATE-01` Do not erase session-scoped discoveries on repeat actions

> **mobile** · state · ↩ `RL-20260430-001`

**📜 Rule**\
When a screen promises discoveries for the lifetime of an open session, repeated scans should accumulate or deliberately preserve previous discoveries.

**✅ Check**\
> Did this store scan/discovery results for an open sheet or screen? If yes, does a later empty result unintentionally erase earlier discoveries?

---

## 🌐 mobile › permissions

<a id="mob-01"></a>
### `MOB-01` Branch permission UX on real denials; open Settings only on tap

> **mobile** · permissions · 2 examples · ↩ `RL-20260505-006` · `RL-20260505-001`

**📜 Rule**\
Permission-denied explainers run only for actual denial or restriction outcomes, not registration or network failures, and open system Settings only from a clearly labeled user-tapped control, never from wrapper taps or automatic denial handling.

**✅ Check**\
> Did this permission flow show a denial explainer or call `Linking.openSettings`? If yes, does it branch on the permission result rather than any caught error, and is Settings reachable only from the explicit button?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>mobile/examples/permissions.md</code> § <em>explicit-settings-navigation</em></summary>

<br>

**explicit-settings-navigation**

Use this when denied or restricted permission state offers a Settings escape
hatch.

Prefer:

```tsx
const wrapperPress =
  permission === 'granted' && !isCameraActive ? activateCamera : undefined

<Pressable onPress={wrapperPress} disabled={!wrapperPress}>
  {permission === 'denied' ? (
    <SafeButton onPress={openSettings}>Open Settings</SafeButton>
  ) : null}
</Pressable>
```

Avoid:

```tsx
const button = getButtonConfig(permission)

<Pressable onPress={button ? button.onPress : undefined}>
  <SafeButton onPress={button?.onPress}>{button?.label}</SafeButton>
</Pressable>
```

Why:

In denied/restricted states, the wrapper is an invisible tap target. Opening
Settings must come from the labeled button, not a tap anywhere in the frame.

<sub>Source: <a href="mobile/examples/permissions.md#explicit-settings-navigation">mobile/examples/permissions.md#explicit-settings-navigation</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>mobile/examples/permissions.md</code> § <em>permission-denial-branches</em></summary>

<br>

**permission-denial-branches**

Use this when a permission request is followed by registration work.

Prefer:

```ts
const permission = await requestPermission()

if (permission.status === 'denied') {
  showSettingsExplainer()
  return
}

const registered = await registerForNotifications()
if (!registered.ok) {
  showRegistrationError()
}
```

Avoid:

```ts
try {
  await requestAndRegister()
} catch {
  showSettingsExplainer()
}
```

Why:

Registration/network failures are not permission denials. Showing a Settings
explainer for every failure sends users to the wrong recovery path.

<sub>Source: <a href="mobile/examples/permissions.md#permission-denial-branches">mobile/examples/permissions.md#permission-denial-branches</a></sub>

</details>

---

## 🌐 general › e2e

<a id="e2e-01"></a>
### `E2E-01` Target test selectors unambiguously

> **general** · e2e · 2 examples · ↩ `RL-20260225-002` · `RL-20260331-004` · `RL-20260409-002` · `RL-20260409-003` · `RL-20260413-002` · `RL-20260605-008` · `RL-20260611-003` · `RL-20260702-004` · `RL-20260729-004` · `RL-20260811-002` · `RL-20260820-004` · `RL-20260825-004`

**📜 Rule**\
E2E helpers (Cypress, Maestro) must target the intended control by stable accessible label, test ID, or scoped container when copy is shared by multiple controls, and text matchers must not be satisfiable by unrelated UI. Component tests locate elements by role, label, or test ID, never by styling-class selectors.

**✅ Check**\
> Did this update an E2E or component-test selector? If yes, can another visible control with similar copy match instead, and does it avoid styling-class selectors?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/testing.md</code> § <em>unambiguous-e2e-selectors</em></summary>

<br>

**unambiguous-e2e-selectors**

Use this when Cypress needs to click a specific control and nearby controls
share similar copy.

Prefer:

```ts
cy.findByRole('button', { name: /^Continue with wallet / }).click()
```

Also acceptable:

```ts
cy.get('[data-testid="wallet-sign-in-button"]').click()
```

Avoid:

```ts
cy.contains('Continue with').click()
```

Why:

Auth and transaction flows often render multiple controls with similar labels.
Broad text selectors can click the first matching button and exercise the wrong
path.

<sub>Source: <a href="examples/general/testing.md#unambiguous-e2e-selectors">examples/general/testing.md#unambiguous-e2e-selectors</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/testing.md</code> § <em>e2e-01-match-formatted-value-regex-to-actual-rendered-output</em></summary>

<br>

**E2E-01 — Match formatted-value regex to actual rendered output**

Source: PR #7533 (RL-20260331-004)

### Avoid

```ts
export function verifyFiatValueVisible() {
  cy.contains(/\$ [\d,]+(\.\d+)?/).should('be.visible')
}
```

### Prefer

```ts
export function verifyFiatValueVisible() {
  // FiatValue inserts a thin Unicode space ( ) after the currency symbol,
  // so the regex must accept any whitespace between symbol and digits.
  cy.contains(/\$\s[\d,]+(\.\d+)?/).should('be.visible')
}
```

### Why

The avoided regex demands an ASCII space after `$`, but the rendered formatter
emits a thin Unicode space. The assertion fails on values that are visually
correct, so the helper produces false negatives whenever it is used.

<sub>Source: <a href="examples/general/testing.md#e2e-01-match-formatted-value-regex-to-actual-rendered-output">examples/general/testing.md#e2e-01-match-formatted-value-regex-to-actual-rendered-output</a></sub>

</details>

---

## 🌐 general › testing

<a id="test-01"></a>
### `TEST-01` Assertions must fail on the regression they claim to cover

> **general** · testing · 6 examples · ↩ `RL-20260217-001` · `RL-20260218-004` · `RL-20260303-010` · `RL-20260318-002` · `RL-20260331-005` · `RL-20260408-001` · `RL-20260408-002` · `RL-20260409-002` · `RL-20260423-002` · `RL-20260506-006` · `RL-20260608-005` · `RL-20260602-002` · `RL-20260609-001` · `RL-20260624-005` · `RL-20260803-003` · `RL-20260806-003` · `RL-20260820-008` · `RL-20260826-002` · `RL-20260911-002` · `RL-20260925-002` · `RL-20261002-003` · `RL-20261012-001`

**📜 Rule**\
Assertions and fixtures must fail loudly when the behavior or fixture data they rely on disappears, and only then: E2E helpers assert what the user sees or the navigation that follows, not implementation details such as a link `href`.

**✅ Check**\
> Did this add or update a test assertion? If yes, would it fail if the bug reappeared or fixture data vanished, and keep passing through a refactor that keeps the behavior?

<details>
<summary><strong>💡 Example 1 of 6</strong> — <code>examples/general/testing.md</code> § <em>negative-assertions</em></summary>

<br>

**negative-assertions**

Use this when asserting that UI is hidden.

Prefer:

```ts
expect(screen.queryByTestId('add-safe-to-workspace-button')).not.toBeInTheDocument()
expect(screen.queryByText('Add Safe to space')).not.toBeInTheDocument()
```

Avoid:

```ts
expect(screen.queryByText('Add Safe to workspace')).not.toBeInTheDocument()
```

Why:

The avoided assertion targets stale copy. It passes even if the current button
renders with the new text.

<sub>Source: <a href="examples/general/testing.md#negative-assertions">examples/general/testing.md#negative-assertions</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 6</strong> — <code>examples/general/testing.md</code> § <em>test-01-assert-the-specific-behavior-the-description-claims</em></summary>

<br>

**TEST-01 — Assert the specific behavior the description claims**

Source: PR #7533 (RL-20260331-005)

### Avoid

```ts
// TC #340
it('Verify that "Total positions value" displays the correct sum of all protocol fiat values', () => {
  portfolio.visitAndSettle(constants.positionsUrl + staticSafes.MATIC_STATIC_SAFE_33)
  portfolio.verifyTotalPositionsTitleVisible()
  portfolio.verifyFiatValueVisible()
})
```

### Prefer

```ts
it('Verify that "Total positions value" displays the correct sum of all protocol fiat values', () => {
  portfolio.visitAndSettle(constants.positionsUrl + staticSafes.MATIC_STATIC_SAFE_33)
  portfolio.verifyTotalPositionsTitleVisible()

  const expectedTotal = portfolio.sumProtocolRowFiatValues()
  portfolio.verifyTotalPositionsValue(expectedTotal)
})
```

### Why

The avoided test is named after a computed total but only checks that some fiat
value is visible. A regression in the sum that still leaves individual rows
populated will pass silently. Tests must assert the specific behavior named in
the description.

<sub>Source: <a href="examples/general/testing.md#test-01-assert-the-specific-behavior-the-description-claims">examples/general/testing.md#test-01-assert-the-specific-behavior-the-description-claims</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 6</strong> — <code>examples/general/testing.md</code> § <em>test-01-mock-external-lookups-instead-of-relying-on-real-fixture-state</em></summary>

<br>

**TEST-01 — Mock external lookups instead of relying on real fixture state**

Source: PR #7589 (RL-20260408-002)

### Avoid

```ts
it('should trust recommendedMasterCopyVersion when chain is not in safe-deployments', () => {
  expect(
    getLatestSafeVersion(chainBuilder().with({ chainId: '25363', recommendedMasterCopyVersion: '1.4.1' }).build()),
  ).toEqual('1.4.1')
})
```

### Prefer

```ts
it('should trust recommendedMasterCopyVersion when chain is not in safe-deployments', () => {
  const spy = jest.spyOn(safeDeployments, 'getSafeSingletonDeployment').mockReturnValueOnce(undefined)

  expect(
    getLatestSafeVersion(chainBuilder().with({ chainId: '99999', recommendedMasterCopyVersion: '1.4.1' }).build()),
  ).toEqual('1.4.1')

  spy.mockRestore()
})

it('falls back when chain is missing and recommendedMasterCopyVersion is null', () => {
  jest.spyOn(safeDeployments, 'getSafeSingletonDeployment').mockReturnValueOnce(undefined)

  expect(
    getLatestSafeVersion(chainBuilder().with({ chainId: '99999', recommendedMasterCopyVersion: null }).build()),
  ).toEqual(LATEST_SAFE_VERSION)
})
```

### Why

The avoided test depends on a third-party package not knowing about a specific
chainId. The moment that package adds the chain, the test stops exercising the
fallback branch and silently becomes meaningless. Mock the lookup so the branch
is hit deterministically, and add a sibling test for the explicit-null variant
to lock in current behavior.

<sub>Source: <a href="examples/general/testing.md#test-01-mock-external-lookups-instead-of-relying-on-real-fixture-state">examples/general/testing.md#test-01-mock-external-lookups-instead-of-relying-on-real-fixture-state</a></sub>

</details>

<details>
<summary><strong>💡 Example 4 of 6</strong> — <code>examples/general/testing.md</code> § <em>test-01-test-the-debounce-not-just-the-post-debounce-assertion</em></summary>

<br>

**TEST-01 — Test the debounce, not just the post-debounce assertion**

Source: PR #7455 (RL-20260318-002)

### Avoid

```ts
// After debounce settles, should still be undefined (no ENS for ADDRESS2)
await waitFor(() => {
  expect(result.current.ens).toBeUndefined()
})
```

### Prefer

```ts
jest.useFakeTimers()
rerender({ address: ADDR_WITHOUT_ENS })
// Stale-guard returns undefined immediately while debounce is pending
expect(result.current.ens).toBeUndefined()
// Advance past the debounce, then assert the lookup happened for the NEW address
act(() => {
  jest.advanceTimersByTime(200)
})
expect(lookupAddress).toHaveBeenCalledWith(ADDR_WITHOUT_ENS)
await waitFor(() => expect(result.current.ens).toBeUndefined())
```

### Why

An assertion that holds on render zero never exercises the debounced behavior, so a regression in the staleness guard slips through. Advance fake timers and assert the new lookup ran so the test fails when the guard is removed.

<sub>Source: <a href="examples/general/testing.md#test-01-test-the-debounce-not-just-the-post-debounce-assertion">examples/general/testing.md#test-01-test-the-debounce-not-just-the-post-debounce-assertion</a></sub>

</details>

<details>
<summary><strong>💡 Example 5 of 6</strong> — <code>examples/general/testing.md</code> § <em>overwriting-localstorage-fixtures-must-include-implicit-app-seeded-entries</em></summary>

<br>

**Overwriting localStorage fixtures must include implicit app-seeded entries**

Source: PR (RL-20260217-001)

### Avoid

```ts
// support/localstorage_data.js
export const sidebarTrustedSafe1Safe2 = {
  11155111: {
    '0xBb26...80aEB': { owners: [], threshold: 1, ethBalance: '0' },
    // missing the visited safe SEP_STATIC_SAFE_9 that autoTrustSafeFromUrl
    // would otherwise add — addToAppLocalStorage overwrites the whole key.
  },
}
```

### Prefer

```ts
export const sidebarTrustedSafe1Safe2 = {
  11155111: {
    '0x9870...5fec0': { owners: [], threshold: 1, ethBalance: '0' }, // visited safe
    '0xBb26...80aEB': { owners: [], threshold: 1, ethBalance: '0' },
  },
}
```

### Why

If the helper writes the whole key (not a merge), any state the app would populate on visit is lost on reload. Every fixture must explicitly carry those entries, or the assertions silently regress against a banner state.

<sub>Source: <a href="examples/general/testing.md#overwriting-localstorage-fixtures-must-include-implicit-app-seeded-entries">examples/general/testing.md#overwriting-localstorage-fixtures-must-include-implicit-app-seeded-entries</a></sub>

</details>

<details>
<summary><strong>💡 Example 6 of 6</strong> — <code>examples/general/testing.md</code> § <em>test-01-click-links-without-asserting-their-href</em></summary>

<br>

**TEST-01 — Click links without asserting their href**

Source: PR #9003 (RL-20261012-001)

### Avoid

```js
const appLink = () => cy.get(`a[aria-label="Open ${app}"]`).first()
appLink().should('have.attr', 'href').and('match', linkWithSafe)
appLink().click()
```

### Prefer

```js
cy.get(`a[aria-label="Open ${app}"]`).first().click()
```

### Why

The `href` check makes every spec that uses the helper depend on how the link encodes its target, so a valid move to client-side navigation fails them while clicking still opens the right app. The spec checks the app that opens. The `href` was only checked to wait for the router; the product now reads the Safe from the URL until the router is ready.

<sub>Source: <a href="examples/general/testing.md#test-01-click-links-without-asserting-their-href">examples/general/testing.md#test-01-click-links-without-asserting-their-href</a></sub>

</details>

---

<a id="test-02"></a>
### `TEST-02` New branch logic needs branch-specific tests

> **general** · testing · 1 example · ↩ `RL-20260318-001` · `RL-20260324-001` · `RL-20260327-004` · `RL-20260407-001` · `RL-20260417-001` · `RL-20260420-002` · `RL-20260428-002` · `RL-20260429-001` · `RL-20260430-001` · `RL-20260430-002` · `RL-20260504-001` · `RL-20260505-002` · `RL-20260505-006` · `RL-20260506-002` · `RL-20260605-009` · `RL-20260609-005` · `RL-20260624-006` · `RL-20260630-001` · `RL-20260806-008` · `RL-20260813-002` · `RL-20260820-006` · `RL-20260909-003` · `RL-20260921-005` · `RL-20261001-002` · `RL-20261002-003` · `RL-20261013-001`

**📜 Rule**\
New skip, hydration, merge-priority, permission, compatibility, and conditional-rendering branches need focused tests that exercise the new branch, not only the happy path.

**✅ Check**\
> Did this add branching behavior? If yes, is the new branch covered by a test that would fail if the branch were removed?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/testing.md</code> § <em>branch-specific-tests</em></summary>

<br>

**branch-specific-tests**

Use this when adding a new skip, hydration, merge-priority, or permission
branch.

Prefer:

```ts
it('skips the request without safe address or known chains', () => {
  renderHook(() => useSafeKnownChainsOverview({ safeAddress: undefined }))

  expect(useSafeOverviewQuery).toHaveBeenCalledWith(expect.anything(), {
    skip: true,
  })
})
```

Avoid:

```ts
it('renders without crashing', () => {
  renderHook(() => useSafeKnownChainsOverview())
})
```

Why:

New branch logic needs a test that fails if the branch is removed.

<sub>Source: <a href="examples/general/testing.md#branch-specific-tests">examples/general/testing.md#branch-specific-tests</a></sub>

</details>

---

<a id="test-03"></a>
### `TEST-03` Test the pure transformation separately from orchestration

> **general** · testing · 2 examples · ↩ `RL-20260317-003` · `RL-20260318-005` · `RL-20260413-007` · `RL-20260605-014` · `RL-20260731-001` · `RL-20260825-003`

**📜 Rule**\
When a hook/component only forwards data into a pure conversion helper, test the conversion helper output directly and keep orchestration tests focused on forwarding behavior.

**✅ Check**\
> Did this add conversion logic plus a caller? If yes, are transformation tests separate from orchestration tests?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/testing.md</code> § <em>conversion-vs-orchestration</em></summary>

<br>

**conversion-vs-orchestration**

Use this when a component or initializer calls a pure conversion helper.

Prefer:

```ts
it('converts CGW chains to Reown networks', () => {
  expect(cgwChainsToReownNetworks(chains)).toEqual(expectedNetworks)
})

it('passes converted networks to AppKit', () => {
  render(<AppKitInitializer />)

  expect(createAppKitInstance).toHaveBeenCalledWith(
    expect.objectContaining({ networks: expectedNetworks }),
  )
})
```

Avoid:

```ts
it('converts networks', () => {
  render(<AppKitInitializer />)

  expect(cgwChainsToReownNetworks).toHaveBeenCalledWith(chains)
})
```

Why:

The caller test proves orchestration. The helper test proves the conversion
output.

<sub>Source: <a href="examples/general/testing.md#conversion-vs-orchestration">examples/general/testing.md#conversion-vs-orchestration</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/api-and-packages.md</code> § <em>test-03-delegate-hooks-to-the-shared-util-instead-of-redeclaring-the-mapping</em></summary>

<br>

**TEST-03 — Delegate hooks to the shared util instead of redeclaring the mapping**

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

<sub>Source: <a href="examples/general/api-and-packages.md#test-03-delegate-hooks-to-the-shared-util-instead-of-redeclaring-the-mapping">examples/general/api-and-packages.md#test-03-delegate-hooks-to-the-shared-util-instead-of-redeclaring-the-mapping</a></sub>

</details>

---

<a id="test-04"></a>
### `TEST-04` Moved behavior needs replacement coverage and matching mocks

> **general** · testing · 1 example · ↩ `RL-20260428-002` · `RL-20260428-003` · `RL-20260615-005` · `RL-20260623-002` · `RL-20260701-004` · `RL-20260714-002` · `RL-20260722-003` · `RL-20260806-001` · `RL-20260812-002` · `RL-20260921-010` · `RL-20261001-002` · `RL-20261009-002`

**📜 Rule**\
When logic moves from one hook/component to another, removed tests must be replaced at the new owner and consumer mocks must match real prop contracts. Mocks follow the code: they target the exact module specifier it imports (barrel vs deep path), and mocks for dependencies it no longer uses are removed. CI path filters and test or story discovery cover the new location.

**✅ Check**\
> Did this move or remove a return field, prop, branch, or dependency? If yes, did equivalent tests move to the new owner, do the tests' mocks still match what the code imports, and do CI triggers still run them?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/testing.md</code> § <em>test-04-extend-ci-path-filters-when-tests-or-stories-move</em></summary>

<br>

**TEST-04 — Extend CI path filters when tests or stories move**

Source: PR #8988 (RL-20261009-002)

### Avoid

```yaml
# Storybook now also loads packages/<new-package>/src/**/*.stories.tsx,
# but the workflow that snapshots the stories still triggers only on the app
on:
  pull_request:
    paths:
      - apps/web/**
```

### Prefer

```yaml
on:
  pull_request:
    paths:
      - apps/web/**
      - packages/<new-package>/**
```

### Why

A PR that changes only the moved files no longer triggers the run, so their tests or stories lose coverage without any failure. Every discovery glob that scans the old path (changed-story scripts, screenshot steps) needs the new location too.

<sub>Source: <a href="examples/general/testing.md#test-04-extend-ci-path-filters-when-tests-or-stories-move">examples/general/testing.md#test-04-extend-ci-path-filters-when-tests-or-stories-move</a></sub>

</details>

---

## 🌐 web › transactions

<a id="tx-01"></a>
### `TX-01` Preserve immutable transaction identity

> **web** · transactions · ↩ `RL-20260410-001`

**📜 Rule**\
Existing queued or rejection transactions must not allow edits that change the transaction hash while the user thinks they are confirming the original transaction.

**✅ Check**\
> Did this make transaction fields editable? If yes, are existing queue/rejection flows still locked where identity must be preserved?

---

<a id="tx-02"></a>
### `TX-02` Submit options must stay switchable

> **web** · transactions · ↩ `RL-20260417-002` · `RL-20260608-009`

**📜 Rule**\
Tx-flow submit options must not auto-register or set global state in a way that hides alternatives. When the chosen option becomes unavailable at execution time, its error offers an inline switch to an available one rather than cancel-and-retry; loading/error recovery follows STATE-03.

**✅ Check**\
> Did this add or auto-select a tx-flow submit option? If yes, can the user switch away, including when the chosen option fails?

---

## 🌐 web › ui

<a id="ux-01"></a>
### `UX-01` Constrained text must truncate or wrap intentionally

> **web** · ui · ↩ `RL-20260217-005` · `RL-20260219-002` · `RL-20260506-001` · `RL-20260612-006` · `RL-20260828-004` · `RL-20260909-005` · `RL-20260921-003` · `RL-20261001-005` · `RL-20261008-007`

**📜 Rule**\
Long user-provided identifiers such as email addresses and names must fit constrained UI the same way wallet addresses do.

**✅ Check**\
> Did this add user-provided text to a constrained sidebar, card, badge, or menu? If yes, is overflow handled intentionally?

---

<a id="ux-02"></a>
### `UX-02` Local rows need local actions

> **web** · ui · 1 example · ↩ `RL-20260415-005`

**📜 Rule**\
Rows that come from local/private data must not show server-backed actions unless they have been promoted or mapped to a server entity.

**✅ Check**\
> Did this merge local/private/server rows into one table? If yes, are row actions valid for that row source?

<details>
<summary><strong>💡 Example</strong> — <code>web/examples/feature-boundaries.md</code> § <em>ux-02-hide-server-backed-actions-on-local-only-rows</em></summary>

<br>

**UX-02 — Hide server-backed actions on local-only rows**

Source: PR #7654 (RL-20260415-005)

### Avoid

```tsx
{
  rows.map((entry) => (
    <TableRow key={entry.address}>
      <TableCell>{entry.name}</TableCell>
      <TableCell className="text-right">
        {/* Edit/Delete here call the server endpoint and 404 for entry.isLocal rows */}
        <EntryAdminActions entry={entry} />
      </TableCell>
    </TableRow>
  ))
}
```

### Prefer

```tsx
{
  rows.map((entry) => (
    <TableRow key={entry.address}>
      <TableCell>{entry.name}</TableCell>
      <TableCell className="text-right">{!entry.isLocal && <EntryAdminActions entry={entry} />}</TableCell>
    </TableRow>
  ))
}
```

### Why

Admin actions wired to server endpoints have no record to mutate for entries
that only exist in local storage, so Edit/Delete fail silently or with a 404.
Either gate the action on row source or first promote the entry into the
server-side store before exposing the action.

<sub>Source: <a href="web/examples/feature-boundaries.md#ux-02-hide-server-backed-actions-on-local-only-rows">web/examples/feature-boundaries.md#ux-02-hide-server-backed-actions-on-local-only-rows</a></sub>

</details>

---

## 🌐 web › observability

<a id="obs-01"></a>
### `OBS-01` Promote telemetry only when user impact justifies it

> **web** · observability · 3 examples · ↩ `RL-20260319-001` · `RL-20260417-003` · `RL-20260601-002` · `RL-20260625-002` · `RL-20260720-005` · `RL-20260729-005` · `RL-20260824-002` · `RL-20260914-002` · `RL-20260921-007` · `RL-20261007-001` · `RL-20261013-003`

**📜 Rule**\
Log and error levels follow user impact: expected retries, browser noise, and duplicate signals stay below error so they don't flood SLOs. An analytics event fired from a shared component takes its entry point or label as a prop, with a dedicated label per surface, never a hardcoded or borrowed one, and event properties come from the call that fires it, never from global state a caller must set first. Impression events fire once per mount and only while shown, session-wide properties are registered globally, and a refactor keeps an existing event's properties and values.

**✅ Check**\
> Did this change logging/RUM/error levels or fire an analytics event? If yes, is the level justified by user impact, is the event attributed to its real entry point by the call that fires it, do impressions fire once and only when visible, and do existing events keep their properties?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>examples/general/api-and-packages.md</code> § <em>obs-01-use-the-shared-analytics-param-key</em></summary>

<br>

**OBS-01 — Use the shared analytics param key**

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

<sub>Source: <a href="examples/general/api-and-packages.md#obs-01-use-the-shared-analytics-param-key">examples/general/api-and-packages.md#obs-01-use-the-shared-analytics-param-key</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 3</strong> — <code>examples/general/api-and-packages.md</code> § <em>obs-01-track-an-impression-once-and-only-when-shown</em></summary>

<br>

**OBS-01 — Track an impression once and only when shown**

Source: PR #8905 (RL-20261007-001)

### Avoid

```tsx
const Banner = ({ location }: Props) => {
  useEffect(() => {
    trackEvent(EVENTS.BANNER_VIEWED, { [Params.LOCATION]: location })
  }, [location])
  // ...
}
```

### Prefer

```tsx
const Banner = ({ location, isShown }: Props) => {
  const hasTrackedView = useRef(false)
  useEffect(() => {
    if (!isShown || hasTrackedView.current) return
    hasTrackedView.current = true
    trackEvent(EVENTS.BANNER_VIEWED, { [Params.LOCATION]: location })
  }, [isShown, location])
  // ...
}
```

### Why

A mount effect re-fires when its deps change and also runs while a parent keeps the UI mounted but hidden, which inflates reach and lowers click-through. The ref limits each mount to one event, and the visibility flag ties it to a real impression.

<sub>Source: <a href="examples/general/api-and-packages.md#obs-01-track-an-impression-once-and-only-when-shown">examples/general/api-and-packages.md#obs-01-track-an-impression-once-and-only-when-shown</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 3</strong> — <code>examples/general/api-and-packages.md</code> § <em>obs-01-take-event-properties-from-the-call-that-fires-it</em></summary>

<br>

**OBS-01 — Take event properties from the call that fires it**

Source: PR #9020 (RL-20261013-003)

### Avoid

```ts
// Every caller has to remember this before it starts a checkout
dispatch(checkoutEntrySet(entry))
void checkout(paymentLinkId)

// Listener on the checkout request
trackEvent(EVENTS.CHECKOUT_STARTED, { ...plan, ...getState().checkoutEntry })
```

### Prefer

```ts
const startCheckout = useCallback(
  async (paymentLinkId: string, props: CheckoutProps) => {
    const result = await trigger({ spaceId, paymentLinkId, returnUrl })
    if (!result.data) return
    trackEvent(EVENTS.CHECKOUT_STARTED, props)
    navigateTo(result.data.url)
  },
  [spaceId, returnUrl, trigger],
)
```

### Why

Nothing enforces the dispatch, so a caller that skips it sends the previous checkout's entry point, and the slice is never cleared. Passing the properties into the call that fires the event adds no global state and sends the event only after the request succeeds. The PR dropped the property instead, because the funnel reads the entry point from its first step; either way, no global slice.

<sub>Source: <a href="examples/general/api-and-packages.md#obs-01-take-event-properties-from-the-call-that-fires-it">examples/general/api-and-packages.md#obs-01-take-event-properties-from-the-call-that-fires-it</a></sub>

</details>

---

## 🌐 general › cache

<a id="cache-01"></a>
### `CACHE-01` Cache stable negative lookups deliberately

> **general** · cache · ↩ `RL-20260420-003` · `RL-20260825-005` · `RL-20260921-004`

**📜 Rule**\
Repeated negative lookups that are expected and stable should be cached with clear TTL/invalidation; transient failures must not be cached as permanent absence.

**✅ Check**\
> Did this resolver repeatedly query for absent data? If yes, is absence cached deliberately without making transient failures permanent?

---

## 🌐 general › ci

<a id="ci-01"></a>
### `CI-01` Scope CI concurrency and generated labels to the real target

> **general** · ci · 1 example · ↩ `RL-20260302-002` · `RL-20260318-008` · `RL-20260326-003` · `RL-20260407-002` · `RL-20260422-001` · `RL-20260612-002`

**📜 Rule**\
CI concurrency groups and generated deployment labels must include the branch/ref and any static suffixes that affect the real limit.

**✅ Check**\
> Did this add or edit workflow concurrency, preview URLs, or DNS labels? If yes, is the real full label/ref scoped correctly?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/api-and-packages.md</code> § <em>ci-01-same-repo-guard-for-pullrequesttarget-workflows</em></summary>

<br>

**CI-01 — Same-repo guard for pull_request_target workflows**

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

<sub>Source: <a href="examples/general/api-and-packages.md#ci-01-same-repo-guard-for-pullrequesttarget-workflows">examples/general/api-and-packages.md#ci-01-same-repo-guard-for-pullrequesttarget-workflows</a></sub>

</details>

---

## 🌐 web › security

<a id="sec-01"></a>
### `SEC-01` Use own-property checks for user-controlled map keys

> **web** · security · ↩ `RL-20260423-003`

**📜 Rule**\
User-controlled strings used as map keys must not index inherited object properties; use `Object.hasOwn`, a null-prototype object, or `Map`.

**✅ Check**\
> Did this map a query string, server string, or external value through an object? If yes, are inherited keys impossible?

---

## 🌐 general › docs

<a id="doc-01"></a>
### `DOC-01` Keep docs, comments, and agent guidance true to the code

> **general** · docs · 2 examples · ↩ `RL-20260303-008` · `RL-20260318-012` · `RL-20260408-003` · `RL-20260430-003` · `RL-20260602-001` · `RL-20260615-003` · `RL-20260622-003` · `RL-20260702-003` · `RL-20260716-008` · `RL-20260803-002` · `RL-20260805-004` · `RL-20260820-001` · `RL-20260825-001` · `RL-20260909-002` · `RL-20260921-001` · `RL-20261001-001` · `RL-20261008-006` · `RL-20260415-001` · `RL-20260615-007` · `RL-20260928-001` · `RL-20261013-002` · `RL-20261014-002` · `RL-20261015-001`

**📜 Rule**\
Moved or split docs keep every removed section or call it out. Comments next to a changed condition or contract change with it and give the non-obvious why in one line, without restating code, decision history, or ticket IDs; a test states its regression intent in its name. Runbooks name real branches and fallback commands, processor disclosures match the integrated SDKs, and a framework, script, or tool change updates the nearest AGENTS.md with how the tool really behaves.

**✅ Check**\
> Did this move docs, add a comment, change logic a comment describes, or change a runbook, disclosure, framework, script, or tool? If yes, is every removed section accounted for, is each comment one line of why that matches the code, and do runbooks, disclosures, and AGENTS.md match the real setup?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/comments-and-docs.md</code> § <em>doc-01-one-line-of-why-no-narration-or-ticket-ids</em></summary>

<br>

**DOC-01 — One line of why, no narration or ticket IDs**

Source: PR #9093, #9075, #8980 (RL-20261015-001)

### Avoid

```ts
/**
 * Step-up authentication for the sensitive Workspace actions that start outside a Workspace: from a Safe page and
 * from the Workspace creation wizard. These flows send the step-up back to their own page, not the page the user
 * left, so that the replay can move the user on.
 */
```

```ts
// The user confirms this transaction with these critical findings. Analyses can deliver later or as new objects,
// so only a change of the transaction or of the findings asks for the confirmation again.
```

### Prefer

```ts
// These flows start outside a Workspace and return the step-up to their own page, not the page the user left.
```

```ts
// A confirmation covers one transaction with one set of critical findings; any change asks again.
```

### Why

The multi-line versions narrate what the code and its names already say, and drift when the code changes. One line keeps only the invariant the code cannot show. Ticket IDs belong in the PR description, not in a comment.

<sub>Source: <a href="examples/general/comments-and-docs.md#doc-01-one-line-of-why-no-narration-or-ticket-ids">examples/general/comments-and-docs.md#doc-01-one-line-of-why-no-narration-or-ticket-ids</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/comments-and-docs.md</code> § <em>doc-01-name-e2e-tests-with-should-and-when</em></summary>

<br>

**DOC-01 — Name E2E tests with should and when**

Source: PR #9075 (RL-20261014-002)

### Avoid

```ts
test('that a Safe is added to the Workspace after the code', async ({ safePage, safes }) => {
```

### Prefer

```ts
test('should add the Safe to the Workspace when the step-up succeeds', async ({ safePage, safes }) => {
```

### Why

The E2E guidance requires `should [expected behavior] when [condition]`, so a CI failure names the broken behavior and the condition that triggers it.

<sub>Source: <a href="examples/general/comments-and-docs.md#doc-01-name-e2e-tests-with-should-and-when">examples/general/comments-and-docs.md#doc-01-name-e2e-tests-with-should-and-when</a></sub>

</details>

---

## 🌐 web › navigation

<a id="web-04"></a>
### `WEB-04` Build Safe-scoped navigation from loaded Safe state

> **web** · navigation · 2 examples · ↩ `RL-20260217-002` · `RL-20260402-001` · `RL-20260410-003` · `RL-20260429-002` · `RL-20260520-001` · `RL-20260615-008` · `RL-20260702-005`

**📜 Rule**\
Safe-scoped CTAs and route builders must use the loaded Safe source of truth and block unavailable flows for undeployed Safes instead of trusting optional query params. Space-scoped navigation must preserve the URL `spaceId` as the source of truth; helper hooks should not silently fall back to the first available Space when the URL is absent.

**✅ Check**\
> Did this add a Safe- or Space-scoped link, CTA, or router push? If yes, does it use loaded state, preserve the active `spaceId`, and gate undeployed-Safe blocked routes?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>web/examples/feature-boundaries.md</code> § <em>web-04-reusable-onboarding-components-must-not-hard-code-back-navigation</em></summary>

<br>

**WEB-04 — Reusable onboarding components must not hard-code Back navigation**

Source: PR #7381 (RL-20260410-003)

### Avoid

```tsx
// CreateOnboarding is mounted on /welcome AND /entities/create-entity
export function CreateOnboarding() {
  const router = useRouter()
  return (
    <Button variant="ghost" onClick={() => router.push(AppRoutes.welcome.entities)}>
      Back
    </Button>
  )
}
```

### Prefer

```tsx
export function CreateOnboarding() {
  const router = useRouter()
  // Either use history back …
  const onBack = () => router.back()
  // … or derive the target from the current pathname
  return (
    <Button variant="ghost" onClick={onBack}>
      Back
    </Button>
  )
}
```

### Why

A component reused under multiple routes can't assume one canonical parent.
Hard-coding the Back target sends users from `/entities/create-entity` into
`/welcome`, breaking the navigation contract for users who already have
entities. Use `router.back()` or a pathname-aware target so the control behaves
correctly in every mount point.

<sub>Source: <a href="web/examples/feature-boundaries.md#web-04-reusable-onboarding-components-must-not-hard-code-back-navigation">web/examples/feature-boundaries.md#web-04-reusable-onboarding-components-must-not-hard-code-back-navigation</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>web/examples/feature-boundaries.md</code> § <em>prefix-match-pathname-against-route-not-the-reverse</em></summary>

<br>

**Prefix-match pathname against route, not the reverse**

Source: PR (RL-20260217-002)

### Avoid

```ts
isPublicRoute: PUBLIC_ROUTES.some((route) => route.startsWith(pathname))
// matches '/w' as public because '/welcome'.startsWith('/w') is true
```

### Prefer

```ts
isPublicRoute: PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
```

### Why

Route prefixes describe a hierarchy where pathname is the (possibly nested) child. Inverting the direction lets short / partial pathnames satisfy any longer route, breaking redirect logic.

<sub>Source: <a href="web/examples/feature-boundaries.md#prefix-match-pathname-against-route-not-the-reverse">web/examples/feature-boundaries.md#prefix-match-pathname-against-route-not-the-reverse</a></sub>

</details>

---

## 🌐 mobile › navigation

<a id="mob-04"></a>
### `MOB-04` Keep Expo route components structural

> **mobile** · navigation · ↩ `RL-20260217-004` · `RL-20260331-001` · `RL-20260624-008`

**📜 Rule**\
Expo Router layout files should define shell/navigation structure; business cleanup, disconnect, validation, and navigation side effects belong in focused containers, hooks, or screen logic. Protocol/SDK request lifecycles belong in Redux listener middleware that reads live store state; screens dispatch intent.

**✅ Check**\
> Did this add logic to an Expo Router `_layout.tsx`, or protocol/SDK side effects to a screen or provider? If yes, is the layout only structural shell code, and does the lifecycle live in listener middleware?

---

## 🌐 web › auth

<a id="web-05"></a>
### `WEB-05` Sanitize auth redirects and outcomes

> **web** · auth · 3 examples · ↩ `RL-20260220-001` · `RL-20260312-004` · `RL-20260325-001` · `RL-20260407-003`

**📜 Rule**\
Auth redirect URLs must remove transient error/query state and validate externally supplied return targets before sending users through OIDC or callback flows.

**✅ Check**\
> Did this add or change an auth redirect or callback? If yes, is the return URL sanitized and validated?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>examples/general/gateway-hooks.md</code> § <em>web-05-trigger-redirect-endpoints-via-top-level-navigation</em></summary>

<br>

**WEB-05 — Trigger redirect endpoints via top-level navigation**

Source: PR #7560 (RL-20260407-003)

### Avoid

```ts
try {
  const redirectUrl = new URL(AppRoutes.welcome.spaces, window.location.origin).toString()
  await entityLogoutWithRedirect({
    logoutDto: { redirect_url: redirectUrl },
  })
  dispatch(setUnauthenticated())
} catch {
  logError(Errors._109)
}
```

### Prefer

```ts
const redirectUrl = new URL(AppRoutes.welcome.spaces, window.location.origin).toString()
const form = document.createElement('form')
form.method = 'POST'
form.action = `${GATEWAY_URL}/v1/auth/logout/redirect`
const input = document.createElement('input')
input.name = 'redirect_url'
input.value = redirectUrl
form.appendChild(input)
document.body.appendChild(form)
sessionStorage.setItem(LOGGING_OUT_KEY, '1')
form.submit()
// Do not remove the form synchronously — let the navigation start first.
```

### Why

Endpoints that return a 303 to clear an upstream IdP session must be reached
through a top-level browser navigation. Calling them via fetch/RTK Query
returns 200 to the SPA but never propagates the IdP-side session clear, so
OIDC users get auto-signed-in on the next attempt. Removing the form
synchronously can also cancel the POST before it reaches the gateway.

<sub>Source: <a href="examples/general/gateway-hooks.md#web-05-trigger-redirect-endpoints-via-top-level-navigation">examples/general/gateway-hooks.md#web-05-trigger-redirect-endpoints-via-top-level-navigation</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 3</strong> — <code>web/examples/feature-boundaries.md</code> § <em>branch-the-action-do-not-duplicate-the-match</em></summary>

<br>

**Branch the action, do not duplicate the match**

Source: PR #7383 (RL-20260312-004)

### Avoid

```ts
// Spaces routes require SIWE auth → redirect to welcome/spaces
{
  match: ({ isSpacesPath, isSiweAuthenticated }) => isSpacesPath && !isSiweAuthenticated,
  action: () => redirect(AppRoutes.welcome.spaces),
},
{
  match: ({ isSiweAuthenticated }) => !isSiweAuthenticated,
  action: () => redirect(AppRoutes.welcome.index),
},
```

### Prefer

```ts
{
  match: ({ isSiweAuthenticated }) => !isSiweAuthenticated,
  action: ({ isSpacesPath }) =>
    redirect(isSpacesPath ? AppRoutes.welcome.spaces : AppRoutes.welcome.index),
},
```

### Why

The Spaces-specific rule was unreachable in practice — the broader rule already matched first. Collapsing into one rule with a branched action keeps the redirect destination reviewable in one place.

<sub>Source: <a href="web/examples/feature-boundaries.md#branch-the-action-do-not-duplicate-the-match">web/examples/feature-boundaries.md#branch-the-action-do-not-duplicate-the-match</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 3</strong> — <code>web/examples/feature-boundaries.md</code> § <em>validate-safe-app-urls-before-postmessage-origin-checks</em></summary>

<br>

**Validate Safe App URLs before postMessage origin checks**

Source: PR (RL-20260220-001)

### Avoid

```ts
const initCommunicator = (iframeRef, app?: SafeAppData) => {
  communicatorInstance = new AppCommunicator(iframeRef, {
    allowedOrigin: new URL(app?.url ?? '').origin,
  })
}

function isValidMessage(msg) {
  if (msg.data?.isCookieEnabled) return true
  return originMatches(msg) && sentFromIframe(msg)
}
```

### Prefer

```ts
const initCommunicator = (iframeRef, app: SafeAppData) => {
  let allowedOrigin: string
  try {
    allowedOrigin = new URL(app.url).origin
  } catch (error) {
    console.error('Invalid Safe App URL', error)
    return
  }
  communicatorInstance = new AppCommunicator(iframeRef, { allowedOrigin })
}

function isValidMessage(msg) {
  return originMatches(msg) && sentFromIframe(msg)
}
```

### Why

Early-return bypasses on payload shape let any cross-origin sender opt out of origin checks. Untyped URL parsing crashes the effect for Safe Apps with malformed URLs. Validate before constructing origin and gate every message on origin+source.

<sub>Source: <a href="web/examples/feature-boundaries.md#validate-safe-app-urls-before-postmessage-origin-checks">web/examples/feature-boundaries.md#validate-safe-app-urls-before-postmessage-origin-checks</a></sub>

</details>

---

## 🌐 general › ui

<a id="ui-01"></a>
### `UI-01` Use theme tokens and hosted assets

> **general** · ui · 1 example · ↩ `RL-20260219-003` · `RL-20260312-003` · `RL-20260317-001` · `RL-20260327-003` · `RL-20260327-005` · `RL-20260608-001` · `RL-20260608-003` · `RL-20260605-013` · `RL-20260608-010` · `RL-20260609-007` · `RL-20260624-004` · `RL-20260701-002` · `RL-20260713-003` · `RL-20260729-002` · `RL-20260825-002` · `RL-20260907-002` · `RL-20260909-001`

**📜 Rule**\
UI colors and reusable assets should use theme variables/tokens and hosted files instead of hardcoded hex values or embedded base64 data.

**✅ Check**\
> Did this add colors, icons, or image assets? If yes, are they theme-backed or hosted rather than hardcoded/embedded?

<details>
<summary><strong>💡 Example</strong> — <code>web/examples/feature-boundaries.md</code> § <em>theme-a-static-logo-via-css-mask-not-bundled-svg</em></summary>

<br>

**Theme a static logo via CSS mask, not bundled SVG**

Source: PR #7398 (RL-20260312-003)

### Avoid

```ts
import Image from 'next/image'
import SafeLogo from '@/public/images/logo-no-text.svg'

export const SidebarTopBar = () => (
  <Image src={SafeLogo} alt="Safe" width={28} height={28} />
)
```

### Prefer

```ts
// SidebarTopBar.tsx
export const SidebarTopBar = () => (
  <span className={css.safeLogo} aria-label="Safe" role="img" />
)

// SidebarTopBar.module.css
.safeLogo {
  width: 28px;
  height: 28px;
  background-color: currentColor;
  mask: url('/images/logo-no-text.svg') no-repeat center / contain;
  -webkit-mask: url('/images/logo-no-text.svg') no-repeat center / contain;
}
```

### Why

Reviewer flagged a 143 KB main-bundle increase from the bundled SVG. CSS mask keeps the file under `/public`, themable via `currentColor`, with no bundle cost.

<sub>Source: <a href="web/examples/feature-boundaries.md#theme-a-static-logo-via-css-mask-not-bundled-svg">web/examples/feature-boundaries.md#theme-a-static-logo-via-css-mask-not-bundled-svg</a></sub>

</details>

---

## 🌐 general › ci

<a id="ci-02"></a>
### `CI-02` Release workflows must compute against the pre-change state

> **general** · ci · ↩ `RL-20260326-002` · `RL-20260326-003` · `RL-20260327-001`

**📜 Rule**\
Release workflows must read previous tags, changelog ranges, and duplicate namespaces before creating the new tag or artifact that changes those queries.

**✅ Check**\
> Did this workflow create a tag, release, changelog, or artifact? If yes, are previous-state queries computed before the new state is created?

---

## 🌐 mobile › providers

<a id="mob-05"></a>
### `MOB-05` Configure mobile providers from app state and supported config

> **mobile** · providers · 1 example · ↩ `RL-20260311-012` · `RL-20260327-002` · `RL-20260327-003`

**📜 Rule**\
Mobile wallet/provider integrations should sit low enough in the provider tree to read store/config state, use supported network/config sources, and avoid bundle-heavy embedded assets.

**✅ Check**\
> Did this add or move a mobile provider or wallet integration? If yes, can it read store/config state and avoid hardcoded networks or embedded assets?

<details>
<summary><strong>💡 Example</strong> — <code>mobile/examples/permissions.md</code> § <em>dont-fake-configurability-you-cant-ship-without-a-release</em></summary>

<br>

**Don't fake configurability you can't ship without a release**

Source: PR #7385 (RL-20260311-012)

### Avoid

```ts
const config = new DatadogProviderConfiguration(
  clientToken,
  process.env.EXPO_PUBLIC_DD_ENV ?? 'production',
  TrackingConsent.NOT_GRANTED,
)
config.verbosity = process.env.EXPO_PUBLIC_DD_VERBOSITY === 'DEBUG' ? SdkVerbosity.DEBUG : SdkVerbosity.WARN
config.uploadFrequency =
  process.env.EXPO_PUBLIC_DD_UPLOAD_FREQ === 'FREQUENT' ? UploadFrequency.FREQUENT : UploadFrequency.AVERAGE
```

### Prefer

```ts
const ddDebug = __DEV__
const config = new DatadogProviderConfiguration(
  clientToken,
  process.env.EXPO_PUBLIC_DD_ENV ?? 'production',
  TrackingConsent.NOT_GRANTED,
)
config.verbosity = ddDebug ? SdkVerbosity.DEBUG : SdkVerbosity.WARN
config.uploadFrequency = ddDebug ? UploadFrequency.FREQUENT : UploadFrequency.AVERAGE
config.batchSize = ddDebug ? BatchSize.SMALL : BatchSize.MEDIUM
```

### Why

Author's response: 'Doesn't matter as I can't manipulate them in production. We always have to create a new release.' Hardcoded branches are honest about the rotation model.

<sub>Source: <a href="mobile/examples/permissions.md#dont-fake-configurability-you-cant-ship-without-a-release">mobile/examples/permissions.md#dont-fake-configurability-you-cant-ship-without-a-release</a></sub>

</details>

---

## 🌐 web › config

<a id="config-01"></a>
### `CONFIG-01` Add env vars only for new values; match defaults to parsers

> **web** · config · 1 example · ↩ `RL-20260326-005` · `RL-20261008-004`

**📜 Rule**\
Add an env var only for a value no existing source provides: the config service already serves per-chain data such as `rpcUri`, and a value fixed for the app is a constant. Default values for env-var-driven config must satisfy the same parser or strict check the runtime applies to non-default values. For origin allowlists, omit trailing slashes since browser-supplied origins are slashless.

**✅ Check**\
> Did this introduce an env var or change its default? If yes, does the config service or a constant already provide the value? Run the default through the consuming check; would the strict path accept it without normalization?

<details>
<summary><strong>💡 Example</strong> — <code>web/examples/config-and-env.md</code> § <em>config-01-match-env-var-defaults-to-consumer-parsers</em></summary>

<br>

**CONFIG-01 — Match env-var defaults to consumer parsers**

Source: PR #7459 (RL-20260326-005)

### Avoid

```ts
export const SUPPORT_CHAT_ALIAS_DOMAIN = process.env.NEXT_PUBLIC_SUPPORT_CHAT_ALIAS_DOMAIN || 'anon.safe.global'
export const SUPPORT_CHAT_URL = process.env.NEXT_PUBLIC_PYLON_CHAT_URL || 'https://safe-support.vercel.app/chat'
export const SUPPORT_CHAT_ENABLED = process.env.NEXT_PUBLIC_SHOW_SUPPORT_CHAT === 'true'
export const SUPPORT_CHAT_ALLOWED_PARENTS =
  process.env.NEXT_PUBLIC_SUPPORT_CHAT_ALLOWED_PARENTS ||
  'http://localhost https://app.safe.global https://safe-support.vercel.app/'
```

### Prefer

```ts
export const SUPPORT_CHAT_ALIAS_DOMAIN = process.env.NEXT_PUBLIC_SUPPORT_CHAT_ALIAS_DOMAIN || 'anon.safe.global'
export const SUPPORT_CHAT_URL = process.env.NEXT_PUBLIC_PYLON_CHAT_URL || 'https://safe-support.vercel.app/chat'
export const SUPPORT_CHAT_ENABLED = process.env.NEXT_PUBLIC_SHOW_SUPPORT_CHAT === 'true'
export const SUPPORT_CHAT_ALLOWED_PARENTS =
  process.env.NEXT_PUBLIC_SUPPORT_CHAT_ALLOWED_PARENTS ||
  'http://localhost https://app.safe.global https://safe-support.vercel.app'
```

### Why

Browser-supplied origins (e.g. `event.origin`, `window.location.origin`) are
always slashless — `https://safe-support.vercel.app`, never with a trailing
`/`. When the env-var default carries a trailing slash, strict equality checks
in the consumer (`useSupportChat` parses the space-separated list and compares
each entry against the incoming origin) silently reject legitimate parents
even when the env var is unset. Keep the default in the exact shape the
consumer parses: no trailing slash on origin entries.

<sub>Source: <a href="web/examples/config-and-env.md#config-01-match-env-var-defaults-to-consumer-parsers">web/examples/config-and-env.md#config-01-match-env-var-defaults-to-consumer-parsers</a></sub>

</details>

---

## 🌐 general › ui

<a id="ux-03"></a>
### `UX-03` Visible behaviour changes are deliberate and confirmed

> **general** · ui · ↩ `RL-20260302-003` · `RL-20260318-010` · `RL-20260410-004` · `RL-20260604-004` · `RL-20260908-002` · `RL-20260420-004` · `RL-20260619-002` · `RL-20260930-008` · `RL-20261002-006`

**📜 Rule**\
A visible change the code does not mechanically imply (balances, disabled actions, copy, navigation, flows) cites the product or design decision, including copy that departs from the design file. Replacing shared chrome (topbar, sidebar, layout) or an existing input or control starts from a feature delta against the old one: carry forward the icons, indicators, entry points, row actions, test IDs, and input behaviour users rely on, and document each deliberate removal.

**✅ Check**\
> Did this alter visible behaviour or replace shared chrome or an existing control? If yes, is the product/design decision explicit, and is every feature that disappeared a deliberate, documented call?

---

## 🌐 general › packages

<a id="pkg-01"></a>
### `PKG-01` Do not duplicate shared package files in app source

> **general** · packages · 1 example · ↩ `RL-20260415-007` · `RL-20260605-001` · `RL-20260717-001`

**📜 Rule**\
When a shared package (`packages/**`) owns a config, type, ABI, or generated file, app code must import from the package's public entrypoint rather than maintaining a parallel app-local copy. Duplication drifts silently and breaks both apps as the source of truth changes.

**✅ Check**\
> Did this add or move a config/types/generated file under `apps/**`? If yes, does an equivalent file already exist in `packages/**`, and should the app import from there instead?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/api-and-packages.md</code> § <em>pkg-01-do-not-duplicate-shared-package-config-in-app-source</em></summary>

<br>

**PKG-01 — Do not duplicate shared package config in app source**

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

<sub>Source: <a href="examples/general/api-and-packages.md#pkg-01-do-not-duplicate-shared-package-config-in-app-source">examples/general/api-and-packages.md#pkg-01-do-not-duplicate-shared-package-config-in-app-source</a></sub>

</details>

---

## 🌐 web › ui

<a id="ui-02"></a>
### `UI-02` Pick z-index from a documented layer scale

> **web** · ui · ↩ `RL-20260317-002` · `RL-20260605-004` · `RL-20260826-003`

**📜 Rule**\
When introducing or adjusting a z-index, place it on a documented scale of existing app layers (drawers, popovers, dialogs, notifications) rather than inventing an isolated value, and justify the choice in a comment if it must sit between two known layers.

**✅ Check**\
> Does this z-index reference an existing documented layer or scale, or is it an arbitrary value?

---

## 🌐 general › review

<a id="review-01"></a>
### `REVIEW-01` Keep each PR to one stated scope

> **general** · review · ↩ `RL-20260318-004` · `RL-20260603-002` · `RL-20260818-001` · `RL-20260907-003` · `RL-20260909-009` · `RL-20260921-011` · `RL-20261001-003` · `RL-20261002-007`

**📜 Rule**\
A PR carries one ticket's worth of change so it can be reviewed, verified, and reverted alone: no unrelated production refactors in CI, tooling, or test-infrastructure PRs, no unrelated UI in a critical fix, and no AI working docs or review screenshots. Port and restore PRs keep behaviour parity and send pre-existing bugs to a separate fix.

**✅ Check**\
> Does this PR contain changes outside its stated scope, or scratch files and review assets? If yes, split or remove them.

---

## 🌐 general › state

<a id="state-02"></a>
### `STATE-02` Reset context state when its precondition flips

> **general** · state · 3 examples · ↩ `RL-20260318-007` · `RL-20260605-005` · `RL-20260713-006` · `RL-20260716-006` · `RL-20260820-002` · `RL-20260916-005` · `RL-20260311-013` · `RL-20261015-002`

**📜 Rule**\
When an effect writes derived values into a context based on a precondition, the false branch explicitly resets them; do not rely on the next true branch to overwrite them. Telemetry user context (`setUser`, `addUserExtraInfo`, `identify`) is cleared the same way when its entity becomes absent. A component whose local state belongs to one entity remounts with `key={entityId}` or derives that state from the id it was set for, instead of resetting it in an effect.

**✅ Check**\
> Does this conditional context or telemetry-context write also clear its values when the condition turns false or the entity disappears, so consumers never see stale data, and does entity-scoped local state reset through a `key` or a stored id instead of an effect?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>examples/general/data-integrity.md</code> § <em>state-02-reset-context-state-when-its-precondition-flips</em></summary>

<br>

**STATE-02 — Reset context state when its precondition flips**

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

<sub>Source: <a href="examples/general/data-integrity.md#state-02-reset-context-state-when-its-precondition-flips">examples/general/data-integrity.md#state-02-reset-context-state-when-its-precondition-flips</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 3</strong> — <code>mobile/examples/permissions.md</code> § <em>clear-telemetry-context-when-the-entity-becomes-null</em></summary>

<br>

**Clear telemetry context when the entity becomes null**

Source: PR #7385 (RL-20260311-013)

### Avoid

```ts
useEffect(() => {
  if (consented && activeSafe?.address && activeSafe?.chainId) {
    DdSdkReactNative.addUserExtraInfo({
      safeAddress: activeSafe.address,
      chainId: activeSafe.chainId,
    })
  }
}, [consented, activeSafe?.address, activeSafe?.chainId])
```

### Prefer

```ts
useEffect(() => {
  if (!consented) return
  if (activeSafe?.address && activeSafe?.chainId) {
    DdSdkReactNative.addUserExtraInfo({
      safeAddress: activeSafe.address,
      chainId: activeSafe.chainId,
    })
  } else {
    DdSdkReactNative.addUserExtraInfo({ safeAddress: null, chainId: null })
  }
}, [consented, activeSafe?.address, activeSafe?.chainId])
```

### Why

Without the reset, RUM events after the user wipes their last Safe still carry the previous safeAddress/chainId, which silently corrupts attribution dashboards.

<sub>Source: <a href="mobile/examples/permissions.md#clear-telemetry-context-when-the-entity-becomes-null">mobile/examples/permissions.md#clear-telemetry-context-when-the-entity-becomes-null</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 3</strong> — <code>examples/general/data-integrity.md</code> § <em>state-02-reset-entity-scoped-state-with-a-key-not-an-effect</em></summary>

<br>

**STATE-02 — Reset entity-scoped state with a key, not an effect**

Source: PR #8979, #9093 (RL-20261015-002)

### Avoid

```tsx
const [answeredSafe, setAnsweredSafe] = useState<string>()
if (!isChoosing || answeredSafe === safeKey) return null
```

```tsx
const [isConfirmed, setIsConfirmed] = useState(false)
const confirmationKey = JSON.stringify([txKey, criticalFindings])
useEffect(() => {
  setIsConfirmed(false)
}, [confirmationKey])
```

### Prefer

```tsx
const ChooserDialog = (): ReactElement | null => {
  const { safeKey, pick } = useSafePick()
  return safeKey ? <Chooser key={safeKey} pick={pick} /> : null
}
```

```tsx
const riskKey = JSON.stringify([txKey, criticalFindings])
const [confirmedRiskKey, setConfirmedRiskKey] = useState<string>()
const isConfirmed = confirmedRiskKey === riskKey
```

### Why

A stored id compared with the current one survives leaving and reopening the same entity, so the second visit to Safe A skips the question. Remounting with `key` starts each visit with fresh state. An effect reset runs only after the render with the new key, so for one render the old confirmation still counts; deriving the flag from the stored key is right in that same render.

<sub>Source: <a href="examples/general/data-integrity.md#state-02-reset-entity-scoped-state-with-a-key-not-an-effect">examples/general/data-integrity.md#state-02-reset-entity-scoped-state-with-a-key-not-an-effect</a></sub>

</details>

---

## 🌐 web › testing

<a id="test-05"></a>
### `TEST-05` Pick the right test fixture surface: builders for unit tests, MSW fixtures for integration

> **web** · testing · 1 example · ↩ `RL-20260313-002` · `RL-20260713-005` · `RL-20260716-009` · `RL-20260803-001` · `RL-20260811-004` · `RL-20260826-001` · `RL-20260916-003`

**📜 Rule**\
Use Builder.new<T>().with({...}) data for unit tests so the field under test is isolated and randomized data exposes hidden assumptions. Reach for MSW fixtures only when the test mocks the network layer and needs a realistic CGW response.

**✅ Check**\
> Unit tests under `*.test.ts(x)` must not import from `config/test/msw/fixtures/`.

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/testing.md</code> § <em>builders-vs-msw-fixtures</em></summary>

<br>

**Builders vs MSW fixtures**

Source: PR #7416 (RL-20260313-002)

### Avoid

```ts
// unit test for a token decimals helper
import { efSafe } from 'config/test/msw/fixtures/balances'

it('handles 6-decimal tokens', () => {
  const usdc = efSafe.balances.find((b) => b.tokenInfo.symbol === 'USDC')!
  expect(formatAmount(usdc)).toBe('1,234.56')
})
```

### Prefer

```ts
import { erc20TokenBuilder } from '@/tests/builders/balances'

it('handles 6-decimal tokens', () => {
  const usdc = erc20TokenBuilder().with({ decimals: 6, balance: '1234560000' }).build()
  expect(formatAmount(usdc)).toBe('1,234.56')
})
```

### Why

MSW fixtures are scenario-shaped real responses tied to specific Safes. They are not minimal test cases, they hide which field the assertion actually depends on, and they deterministically encode values that should be free in a unit test.

<sub>Source: <a href="examples/general/testing.md#builders-vs-msw-fixtures">examples/general/testing.md#builders-vs-msw-fixtures</a></sub>

</details>

---

## 🌐 general › abstractions

<a id="code-03"></a>
### `CODE-03` Split multi-job code; close over shared arguments

> **general** · abstractions · 1 example · ↩ `RL-20260311-005` · `RL-20260929-002`

**📜 Rule**\
A hook, handler, or component that does several things (fetch, resolve, and map; a multi-case switch; a long try/finally) splits into named hooks, functions, or one component per case. Helpers take at most 4 positional parameters: close over shared hook state in a local builder or pass one `deps` object, and group props that travel together into one object.

**✅ Check**\
> Did this add or grow a hook, handler, or component a reviewer must read top to bottom, or a helper with 5+ positional args? If yes, can its steps become named units and its arguments a closure or one object?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/api-and-packages.md</code> § <em>close-over-hook-deps-instead-of-threading-6-args</em></summary>

<br>

**Close over hook deps instead of threading 6 args**

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

<sub>Source: <a href="examples/general/api-and-packages.md#close-over-hook-deps-instead-of-threading-6-args">examples/general/api-and-packages.md#close-over-hook-deps-instead-of-threading-6-args</a></sub>

</details>

---

## 🌐 general › performance

<a id="perf-01"></a>
### `PERF-01` Hoist regex literals and stable JSX out of inner loops

> **general** · performance · 1 example · ↩ `RL-20260312-007` · `RL-20260625-003` · `RL-20260716-007` · `RL-20260824-004`

**📜 Rule**\
When iterating across many items, define regex literals and any structurally-identical JSX wrappers outside the loop. Anything that does not depend on the loop variable should be allocated once.

**✅ Check**\
> Code review: regex literals (`/.../`) appearing inside a `for`/`while`/`map`/`forEach` body and not depending on the iteration variable should be lifted.

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/api-and-packages.md</code> § <em>hoist-regex-literals-out-of-loops</em></summary>

<br>

**Hoist regex literals out of loops**

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

<sub>Source: <a href="examples/general/api-and-packages.md#hoist-regex-literals-out-of-loops">examples/general/api-and-packages.md#hoist-regex-literals-out-of-loops</a></sub>

</details>

---

## 🌐 general › abstractions

<a id="code-05"></a>
### `CODE-05` Compute and name derived values before the return

> **general** · abstractions · 3 examples · ↩ `RL-20260312-008` · `RL-20260608-004` · `RL-20260608-008` · `RL-20260612-008` · `RL-20260909-004` · `RL-20260930-011` · `RL-20260929-001` · `RL-20261008-005` · `RL-20260310-006` · `RL-20260604-005` · `RL-20260710-001` · `RL-20260716-005` · `RL-20260806-005` · `RL-20260911-001` · `RL-20261002-005` · `RL-20261014-005`

**📜 Rule**\
Derive values once before the return, not inline in JSX: a pure helper that reads no hook state lives at module scope, and `useMemo` (above every early return) is for expensive work or identity a consumer needs, not cheap primitives. Three or more `!==` checks on one value become `!DISALLOWED.includes(value)`, and reused conjunctions and multi-way JSX branches become named booleans. Guards return early, type guards list the members they accept, and names say what a value means at the call site (`pendingActions`, positively framed `signersOnly`).

**✅ Check**\
> Did this add a derived value, condition, guard, or identifier in a component or hook? If yes, is it computed and named once before the return, memoized only when expensive or identity matters, do guards return early, and does each name say what it holds?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>mobile/examples/permissions.md</code> § <em>name-the-warning-condition-do-not-chain</em></summary>

<br>

**Name the warning condition; do not chain `!==`**

Source: PR #7402, #7391 (RL-20260312-008)

### Avoid

```ts
{!isSelected &&
  hasAddress &&
  validationState !== 'unknown' &&
  validationState !== 'invalid' &&
  validationState !== 'known-other-chain' &&
  validationState !== 'self-send' && (
  <RecipientWarning state={validationState} />
)}
```

### Prefer

```ts
const NON_WARNABLE_STATES = ['unknown', 'invalid', 'known-other-chain', 'self-send'] as const
const showWarning =
  !isSelected && hasAddress && !NON_WARNABLE_STATES.includes(validationState)

{showWarning && <RecipientWarning state={validationState} />}
```

### Why

Reviewers asked to extract this for readability and to centralize the disallowed list — every new validation state was forcing edits at every call site.

<sub>Source: <a href="mobile/examples/permissions.md#name-the-warning-condition-do-not-chain">mobile/examples/permissions.md#name-the-warning-condition-do-not-chain</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 3</strong> — <code>examples/general/api-and-packages.md</code> § <em>code-05-return-early-from-guard-branches</em></summary>

<br>

**CODE-05 — Return early from guard branches**

Source: PR #8759 (RL-20260929-001)

### Avoid

```ts
if (step === 'select') {
  if (itemsToName.length > 0) {
    setStep('name')
    return
  }
} else if (!hasAllNames(data.names, itemsToName)) {
  return
}
submit(data)
```

### Prefer

```ts
if (step === 'name' && !hasAllNames(data.names, itemsToName)) return

if (step === 'select' && itemsToName.length > 0) {
  setStep('name')
  return
}

submit(data)
```

### Why

Guards that only stop or redirect the submit read as flat early returns; nesting them in if/else makes the reader track which branch falls through to the main path.

<sub>Source: <a href="examples/general/api-and-packages.md#code-05-return-early-from-guard-branches">examples/general/api-and-packages.md#code-05-return-early-from-guard-branches</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 3</strong> — <code>web/examples/feature-boundaries.md</code> § <em>hoist-derived-values-out-of-jsx</em></summary>

<br>

**Hoist derived values out of JSX**

Source: PR #7369 (RL-20260310-006)

### Avoid

```ts
return (
  <Avatar className={css.spaceSelectorAvatar}>
    <AvatarFallback
      className={css.spaceSelectorAvatarFallback}
      style={{ backgroundColor: getAvatarColor(selectedSpace.id) }}
    >
      {initial}
    </AvatarFallback>
  </Avatar>
)
```

### Prefer

```ts
const avatarColor = getAvatarColor(selectedSpace.id)
return (
  <Avatar className={css.spaceSelectorAvatar}>
    <AvatarFallback
      className={css.spaceSelectorAvatarFallback}
      style={{ backgroundColor: avatarColor }}
    >
      {initial}
    </AvatarFallback>
  </Avatar>
)
```

### Why

Reviewer asked to move the derivation outside the render layer. Even when cheap, inlining hides dependencies from reviewers and keeps reusable values trapped inside JSX.

<sub>Source: <a href="web/examples/feature-boundaries.md#hoist-derived-values-out-of-jsx">web/examples/feature-boundaries.md#hoist-derived-values-out-of-jsx</a></sub>

</details>

---

## 🌐 web › features

<a id="feat-04"></a>
### `FEAT-04` Coordinate edits to shared UI primitives with in-flight design-system PRs

> **web** · features · ↩ `RL-20260310-009`

**📜 Rule**\
Before editing files under `apps/web/src/components/ui/*`, check for open PRs that rewrite those files. If one exists, hold the edit, base it on top of the design-system branch, or apply the change in that branch directly.

**✅ Check**\
> PR review checklist: any change to `apps/web/src/components/ui/*` must call out coordination with the design-system rewrite or note that no such PR is open.

---

## 🌐 web › transactions

<a id="tx-03"></a>
### `TX-03` Gate submit on readiness of the data that decides it

> **web** · transactions · 2 examples · ↩ `RL-20260303-002` · `RL-20260608-011` · `RL-20260713-002` · `RL-20260714-001` · `RL-20260928-003` · `RL-20261002-002`

**📜 Rule**\
Block submit until data that sets the on-chain amount or decides whether the action is disabled or warned (token decimals, tx details) has loaded; a `!!data && condition` gate reads as enabled while loading, and a default value silently corrupts the amount. Gate only on data that decides the action. A scoped flow whose SDK or provider is missing throws rather than falling back to the app-wide one.

**✅ Check**\
> Did this submit path depend on token metadata or other loaded data? If yes, is submission disabled until that data is confirmed loaded, does every gate decide this action, and does a missing scoped dependency throw instead of falling back?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/transactions.md</code> § <em>gate-submit-on-token-data-readiness-never-fall-back-to-default-decimals</em></summary>

<br>

**Gate submit on token data readiness, never fall back to default decimals**

Source: PR (RL-20260303-002)

### Avoid

```ts
const token = items.find((t) => t.tokenInfo.address === tokenAddress)
const decimals = token?.tokenInfo.decimals ?? 18 // wrong scale for USDC (6)
// ...later, while balances are still loading:
const weiAmount = safeParseUnits(rawInput, decimals) // proposes wrong amount
```

### Prefer

```ts
function getDecimals(token: Balance | undefined): number {
  const raw = token?.tokenInfo.decimals
  return raw != null ? Number(raw) : 18
}

export function useTokenBalance({ tokenAddress }) {
  const { data } = useTotalBalances()
  const token = findToken(data?.items ?? [], tokenAddress)
  const decimals = getDecimals(token)
  const isTokenDataReady = token?.tokenInfo.decimals != null
  return { token, decimals, isTokenDataReady }
}
// Consumer:
const { isTokenDataReady } = useTokenBalance({ tokenAddress })
const isValid = baseValid && isTokenDataReady // disables Review until known
```

### Why

Defaulting to 18 silently encodes the wrong unit scale; gating on the explicit ready flag prevents users from signing or proposing a transaction with the wrong amount.

<sub>Source: <a href="examples/general/transactions.md#gate-submit-on-token-data-readiness-never-fall-back-to-default-decimals">examples/general/transactions.md#gate-submit-on-token-data-readiness-never-fall-back-to-default-decimals</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/transactions.md</code> § <em>tx-03-throw-when-a-scoped-dependency-is-missing</em></summary>

<br>

**TX-03 — Throw when a scoped dependency is missing**

Source: PR #8874 (RL-20261002-002)

### Avoid

```ts
const getLatestBlockGasLimit = async (scope?: Scope) => {
  const provider = scope?.provider ?? getAppProvider()
  const block = await provider?.getBlock('latest')
  // ...
}
```

### Prefer

```ts
const getLatestBlockGasLimit = async (scope?: Scope) => {
  if (scope && !scope.provider) {
    throw Error('The provider for the selected Safe account is not initialized yet.')
  }
  const provider = scope?.provider ?? getAppProvider()
  // ...
}
```

### Why

While the scoped provider is reset, the fallback silently reads the URL chain instead of the scoped Safe's chain. Falling back only when no scope exists keeps Safe-level flows unchanged and turns the scoped gap into a loud error.

<sub>Source: <a href="examples/general/transactions.md#tx-03-throw-when-a-scoped-dependency-is-missing">examples/general/transactions.md#tx-03-throw-when-a-scoped-dependency-is-missing</a></sub>

</details>

---

## 🌐 general › numerics

<a id="num-01"></a>
### `NUM-01` Serialize numbers for on-chain and signing use exactly

> **general** · numerics · 1 example · ↩ `RL-20260303-004` · `RL-20260707-002`

**📜 Rule**\
When converting fiat or float values into bigint/decimal-string representations, format intermediate math without scientific notation: JS toString() emits '1e-7' for very small numbers, which downstream BigInt parsers reject. Coerce only the named field of a signing payload (e.g. EIP-712 `domain.chainId`), never by key name at any depth, and assert the signing hash is unchanged.

**✅ Check**\
> Does this convert a Number to a decimal string for on-chain use, or coerce fields of a signing payload? If yes, is it formatted with toFixed/Decimal.js, and is coercion scoped to the named field?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>avoid-scientific-notation-in-derived-decimal-strings</em></summary>

<br>

**Avoid scientific notation in derived decimal strings**

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

<sub>Source: <a href="examples/general/data-integrity.md#avoid-scientific-notation-in-derived-decimal-strings">examples/general/data-integrity.md#avoid-scientific-notation-in-derived-decimal-strings</a></sub>

</details>

---

## 🌐 general › state

<a id="state-03"></a>
### `STATE-03` Async attempts start clean, run once, and recover on every exit

> **general** · state · 2 examples · ↩ `RL-20260306-006` · `RL-20260605-011` · `RL-20260609-008` · `RL-20260720-002` · `RL-20260824-001` · `RL-20260918-002` · `RL-20260924-001` · `RL-20261002-001` · `RL-20260303-003`

**📜 Rule**\
Before a retry, submit, or new input (re-upload, file drop) starts async work, synchronously clear the prior result and error, and surface rejected input. Guard against double-submit with a ref set synchronously, not a state flag; set in-flight state after early returns or clear it in `finally`, and close a dialog that shows its own error only on success. In a multi-step submit, order writes so one failure cannot skip another, let a retry redo what is still owed, and drop a built result when a blocker appears.

**✅ Check**\
> Does this retry, submit, or re-trigger path clear the previous result and error first, block a double-submit synchronously, leave no exit with the in-flight flag stuck or its error hidden, and stop a partial failure or retry from skipping a step or keeping a stale result?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>reset-error-state-in-retry-handlers</em></summary>

<br>

**Reset error state in retry handlers**

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

<sub>Source: <a href="examples/general/data-integrity.md#reset-error-state-in-retry-handlers">examples/general/data-integrity.md#reset-error-state-in-retry-handlers</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/transactions.md</code> § <em>synchronous-ref-guard-against-double-submit</em></summary>

<br>

**Synchronous ref guard against double-submit**

Source: PR (RL-20260303-003)

### Avoid

```ts
const [isSubmitting, setIsSubmitting] = useState(false)
const handleReview = async () => {
  if (!isValid || isSubmitting || !activeSigner) return
  setIsSubmitting(true) // async — two rapid taps both pass the guard
  await proposeTransaction(...)
  setIsSubmitting(false)
}
```

### Prefer

```ts
const submittingRef = useRef(false)
const [isSubmitting, setIsSubmitting] = useState(false) // for UI only
const handleReview = async () => {
  if (!isValid || submittingRef.current || !activeSigner) return
  submittingRef.current = true // synchronous — second tap is blocked
  setIsSubmitting(true)
  try {
    await proposeTransaction(...)
  } finally {
    submittingRef.current = false
    setIsSubmitting(false)
  }
}
```

### Why

React state updates are async, so two rapid invocations can both read the old `isSubmitting=false` and propose duplicate transactions with conflicting nonces. A ref written synchronously closes the window.

<sub>Source: <a href="examples/general/transactions.md#synchronous-ref-guard-against-double-submit">examples/general/transactions.md#synchronous-ref-guard-against-double-submit</a></sub>

</details>

---

## 🌐 mobile › navigation

<a id="mob-07"></a>
### `MOB-07` Mount navigators before running navigation effects

> **mobile** · navigation · ↩ `RL-20260303-009`

**📜 Rule**\
Effects that call router.replace/push/back must wait until the navigator has mounted; calling navigation before mount silently no-ops in Expo Router.

**✅ Check**\
> Does this effect navigate during initial render? If yes, is it gated on a mount-ready condition?

---

## 🌐 web › transactions

<a id="tx-05"></a>
### `TX-05` Centralize transaction-derived analyses in SafeShield

> **web** · transactions · ↩ `RL-20260307-011`

**📜 Rule**\
Decoded transaction data, simulation results, and risk analyses should run through the SafeShield context rather than being re-derived in individual components. Centralizing avoids divergent results across review surfaces.

**✅ Check**\
> Does this component re-derive transaction data that SafeShield already exposes? If yes, consume the context instead.

---

## 🌐 web › state

<a id="web-06"></a>
### `WEB-06` Derive reactive parent state from the store, not from child refs

> **web** · state · ↩ `RL-20260302-004` · `RL-20260615-009` · `RL-20260929-004`

**📜 Rule**\
When a parent needs to react to changes inside a child component, drive that reactivity through Redux/store state rather than imperative refs. Refs don't trigger re-renders, so parent UI ends up stale. Likewise keep only a selected entity's id in state and read the entity from the live list each render, so refetches and removals reach the open view.

**✅ Check**\
> Does the parent compute layout/visibility from a child ref, or render a selected entity from a stored copy? If yes, lift the value into the store or keep the id and read the entity from its source each render.

---

## 🌐 mobile › theme

<a id="mob-06"></a>
### `MOB-06` Forward auto theme to native APIs as null

> **mobile** · theme · ↩ `RL-20260226-001`

**📜 Rule**\
When the user picks 'Auto' for theme/appearance, forward that to the native API as `null` so the OS controls the appearance. Forwarding the literal string 'auto' bypasses the OS hook.

**✅ Check**\
> Does this expose a theme setting to native code? If yes, is the auto/system value translated to `null` before crossing the bridge?

---

## 🌐 web › e2e

<a id="e2e-02"></a>
### `E2E-02` Put E2E timeouts where they take effect

> **web** · e2e · 1 example · ↩ `RL-20260218-001` · `RL-20260612-001` · `RL-20260918-001`

**📜 Rule**\
Cypress retries the command, not the chained assertion, so timeouts must go on `cy.get(..., { timeout })`/`cy.contains(..., { timeout })` — passing timeout into `should()` or `expect()` does nothing. A test's own time budget must cover the sum of its inner waits (`test.slow()` or an explicit test timeout).

**✅ Check**\
> Did this E2E test add or raise a timeout, or chain slow setup? Is the timeout on the retryable command, and does the test budget cover its inner waits?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/testing.md</code> § <em>cypress-retry-timeout-belongs-on-the-preceding-command</em></summary>

<br>

**Cypress retry timeout belongs on the preceding command**

Source: PR (RL-20260218-001)

### Avoid

```ts
cy.window().invoke('localStorage.getItem', key).should('equal', '{}', { timeout: 10000 }) // treated as assertion message, not timeout
```

### Prefer

```ts
cy.window({ timeout: 10000 }).invoke('localStorage.getItem', key).should('equal', '{}')
```

### Why

Cypress retries the chained command using the preceding command's timeout. The third argument of .should() is parsed as the failure message, so the intended retry budget silently degrades to the suite default.

<sub>Source: <a href="examples/general/testing.md#cypress-retry-timeout-belongs-on-the-preceding-command">examples/general/testing.md#cypress-retry-timeout-belongs-on-the-preceding-command</a></sub>

</details>

---

## 🌐 general › data

<a id="data-06"></a>
### `DATA-06` Normalize shared identifiers and keys one way

> **general** · data · 3 examples · ↩ `RL-20260218-002` · `RL-20260604-001` · `RL-20260611-006` · `RL-20260702-001` · `RL-20260710-002` · `RL-20260713-001` · `RL-20260707-003` · `RL-20260716-010` · `RL-20260818-005` · `RL-20260916-001` · `RL-20260309-007` · `RL-20260709-002` · `RL-20260716-002` · `RL-20260716-003` · `RL-20260930-001` · `RL-20260302-001` · `RL-20261014-004`

**📜 Rule**\
Every consumer of the same identifier or input (selector, hook, persistence, validator, submit guard, payload) normalizes it identically (`getAddress`, `toLowerCase`, `trim`); divergent normalization fragments caches and lets validation pass a value submit rejects. Compare addresses with `sameAddress`, never `===` or `toLowerCase()`, and key maps by the normalized address, but render the user's casing where users compare characters by eye. A cache, dedup, or list `key` covers every input that changes or distinguishes the value, consumers sharing a cached result pass identical query args, and persisted RTK cache keys use the runtime's exact serialization.

**✅ Check**\
> Did this compare or consume an address, identifier, or user input, or build a cache, dedup, or list key, query args, or persisted cache path? If yes, does it normalize like every other consumer (`sameAddress` for addresses), and does the key cover every input and match the runtime serialization?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>examples/general/data-integrity.md</code> § <em>normalize-rtk-query-cache-keys-at-one-place</em></summary>

<br>

**Normalize RTK Query cache keys at one place**

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

<sub>Source: <a href="examples/general/data-integrity.md#normalize-rtk-query-cache-keys-at-one-place">examples/general/data-integrity.md#normalize-rtk-query-cache-keys-at-one-place</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 3</strong> — <code>examples/general/data-integrity.md</code> § <em>compare-addresses-with-sameaddress-not-tolowercase</em></summary>

<br>

**Compare addresses with sameAddress(), not toLowerCase()**

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

<sub>Source: <a href="examples/general/data-integrity.md#compare-addresses-with-sameaddress-not-tolowercase">examples/general/data-integrity.md#compare-addresses-with-sameaddress-not-tolowercase</a></sub>

</details>

<details>
<summary><strong>💡 Example 3 of 3</strong> — <code>examples/general/data-integrity.md</code> § <em>data-06-key-list-items-by-everything-that-distinguishes-them</em></summary>

<br>

**DATA-06 — Key list items by everything that distinguishes them**

Source: PR #9027 (RL-20261014-004)

### Avoid

```tsx
const rows = removedSpenders.map((spender) => <SpenderRow key={spender} spender={spender} />)
```

### Prefer

```tsx
const rows = removedSpenders.map((spender, index) => <SpenderRow key={`${spender}-${index}`} spender={spender} />)
```

### Why

The usual flow removes each spender once, but the decoder accepts any batch, so a hand-built one can repeat a spender and two rows would share a key. A key stays unique for every input the parser accepts, not only for what the usual flow produces.

<sub>Source: <a href="examples/general/data-integrity.md#data-06-key-list-items-by-everything-that-distinguishes-them">examples/general/data-integrity.md#data-06-key-list-items-by-everything-that-distinguishes-them</a></sub>

</details>

---

## 🌐 general › ci

<a id="ci-03"></a>
### `CI-03` Codegen drift checks must catch untracked outputs and run against PR HEAD

> **general** · ci · ↩ `RL-20260217-003`

**📜 Rule**\
Drift checks for generated code must (1) include `--include-untracked` so newly generated files trigger the failure and (2) run against the actual PR HEAD, not the merge base.

**✅ Check**\
> Did this change a codegen workflow? If yes, does the drift check call `git status --porcelain --include-untracked` and run after the codegen step on the PR commit?

---

## 🌐 web › auth

<a id="web-07"></a>
### `WEB-07` Handle the loading tri-state of feature-flag hooks

> **web** · auth · 1 example · ↩ `RL-20260521-001` · `RL-20260522-001` · `RL-20260604-002` · `RL-20260609-004` · `RL-20260818-003` · `RL-20260909-008` · `RL-20260930-005`

**📜 Rule**\
Flag and gate hooks return `undefined` while config loads; never coerce it with `?? false`. Treat it as still resolving (wait, show a loader, or allow until known), branch on `=== true`/`=== false`, and have callers consume the loading state. A gate escape hatch re-checks `isAuthenticated` so it cannot bypass the gate after sign-in. The flag-off path keeps pre-feature behaviour, and every visible change of an unlaunched feature sits behind its own flag.

**✅ Check**\
> Did this read a flag or gate hook? If yes, is `undefined` handled as loading rather than false, can a premature decision lose `next`, flash the wrong UI, or bypass the gate, and is every visible change behind the flag with the flag-off path unchanged?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/gateway-hooks.md</code> § <em>web-07-handle-the-loading-tri-state-of-feature-flags</em></summary>

<br>

**WEB-07 — Handle the loading tri-state of feature flags**

Source: PR #7884, #7889 (RL-20260522-001, RL-20260521-001)

### Avoid

```ts
const isGateEnabled = useIsResourceGateEnabled() ?? false // undefined while config loads → treated as OFF

// fires on first mount before the flag resolves: drops ?next=, flashes wrong UI
if (isGateEnabled) router.replace(loginPath)
// an opt-in escape hatch that ignores auth state keeps bypassing the gate after sign-in
if (isOptedOut) return false
```

### Prefer

```ts
const gate = useIsResourceGateEnabled() // boolean | undefined

if (gate === undefined) return null // still resolving — wait / allow until known
if (isOptedOut && !isAuthenticated) return false // opt-out scoped to signed-out only
if (gate === true && !isAuthenticated) router.replace(withNext(loginPath))
```

### Why

A flag hook that is `undefined` while its source loads must not be coerced to a hard `false`. Coercion makes routing, `return null` loaders, and gating decisions fire before the value is known — losing the destination URL, flashing the pre-gate screen, or letting a stale opt-in bypass the gate after sign-in. Branch on `=== true`/`=== false` and treat `undefined` as "wait".

<sub>Source: <a href="examples/general/gateway-hooks.md#web-07-handle-the-loading-tri-state-of-feature-flags">examples/general/gateway-hooks.md#web-07-handle-the-loading-tri-state-of-feature-flags</a></sub>

</details>

---

## 🌐 general › abstractions

<a id="code-06"></a>
### `CODE-06` Own the lifecycle of async work

> **general** · abstractions · 1 example · ↩ `RL-20260522-002` · `RL-20260611-005` · `RL-20260612-003` · `RL-20260612-007` · `RL-20260626-002` · `RL-20260715-001` · `RL-20260806-006`

**📜 Rule**\
An async call outside normal awaited control flow (an `onClick={asyncFn}`, a cleanup `disconnect()`, a background effect, a clipboard read) is awaited in a `try/catch` or an IIFE that handles rejection, even when an error state already renders, unless the callee already catches and logs. Timers and awaited calls that set state afterwards are cleared or guarded on unmount.

**✅ Check**\
> Did this add an async call, timer, or awaited state update in a handler, effect, or hook? If yes, is rejection handled, and is it cleared or guarded on unmount?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/gateway-hooks.md</code> § <em>code-06-await-or-catch-fire-and-forget-async</em></summary>

<br>

**CODE-06 — Await or catch fire-and-forget async**

Source: PR #7819, #7886 (RL-20260522-002)

### Avoid

```ts
const onFinish = async () => {
  await submit(payload).unwrap() // rejects → unhandled promise rejection
  router.push(next)
}
;<Button onClick={onFinish} /> // fire-and-forget

cleanup() // un-awaited; rejection escapes
```

### Prefer

```ts
const onFinish = async () => {
  try {
    await submit(payload).unwrap()
    router.push(next)
  } catch {
    // error state already drives the visible alert
  }
}

void (async () => {
  try {
    await cleanup()
  } catch (e) {
    Logger.warn('cleanup failed', e)
  }
})()
```

### Why

An `onClick={asyncFn}` handler and an un-awaited cleanup call both let a rejected promise escape as an unhandled rejection (console + Sentry noise), even when a user-facing error alert already renders. Await inside `try/catch`, or wrap in an awaited IIFE that logs the rejection, so the handled error state is the only surfaced path.

<sub>Source: <a href="examples/general/gateway-hooks.md#code-06-await-or-catch-fire-and-forget-async">examples/general/gateway-hooks.md#code-06-await-or-catch-fire-and-forget-async</a></sub>

</details>

---

## 🌐 general › numerics

<a id="num-02"></a>
### `NUM-02` Validate numeric coercion of external string inputs

> **general** · numerics · 1 example · ↩ `RL-20260522-003` · `RL-20260526-002` · `RL-20260526-003` · `RL-20260615-011` · `RL-20260611-007` · `RL-20260626-001` · `RL-20260806-009` · `RL-20260921-009` · `RL-20260925-001`

**📜 Rule**\
`Number(x)` turns `''` and whitespace into `0` and junk into `NaN`. Parse external strings through a guarded helper (reject nullish, trim, treat empty as unknown, `Number.isFinite` the result) before using them as API args, aggregates, or status decisions, keeping known zero distinct from unknown. Where the valid floor is known, compare exactly (`=== 1`, not `<= 1`) so malformed input surfaces.

**✅ Check**\
> Did this coerce an external string to a number (id, balance, threshold)? If yes, is empty/whitespace/non-finite handled explicitly instead of trusting raw `Number()`, and do bounds use exact comparisons where the floor is known?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>num-02-guard-numeric-coercion-of-external-strings</em></summary>

<br>

**NUM-02 — Guard numeric coercion of external strings**

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

<sub>Source: <a href="examples/general/data-integrity.md#num-02-guard-numeric-coercion-of-external-strings">examples/general/data-integrity.md#num-02-guard-numeric-coercion-of-external-strings</a></sub>

</details>

---

## 🌐 general › state

<a id="rtk-04"></a>
### `RTK-04` Scope RTK Query cache tags per entity id

> **general** · state · 1 example · ↩ `RL-20260601-001` · `RL-20260908-003`

**📜 Rule**\
`providesTags`/`invalidatesTags` must carry an `id` (`[{ type: 'X', id: makeTag(chainId, address) }]`) when the data is per-safe, per-space, or otherwise per-entity. A bare `['X']` tag invalidates every query of that type across all entities, so one mutation triggers a refetch storm. Invalidate only the affected id.

**✅ Check**\
> Did this add or change RTK Query `providesTags`/`invalidatesTags`, or invalidate on an event? If yes, is the tag scoped to the affected entity id rather than a bare type that hits every safe/space?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/gateway-hooks.md</code> § <em>rtk-04-scope-cache-tags-per-id</em></summary>

<br>

**RTK-04 — Scope cache tags per id**

Source: PR #7960, #7935 (RL-20260601-001)

### Avoid

```ts
// every overview query across all chains/safes is invalidated on any tx success
getSafeOverview: build.query({ providesTags: ['SafeOverviews'] })
dispatch(api.util.invalidateTags(['SafeOverviews']))
```

### Prefer

```ts
getSafeOverview: build.query({
  providesTags: (_r, _e, { chainId, address }) => [
    { type: 'SafeOverviews', id: makeSafeOverviewTag(chainId, address) },
  ],
})
dispatch(api.util.invalidateTags([{ type: 'SafeOverviews', id: makeSafeOverviewTag(chainId, address) }]))
```

### Why

A bare `['SafeOverviews']` tag matches every query of that type, so one mutation refetches all of them — a refetch storm that scales with the number of mounted safes/spaces. Carry an `id` derived from the entity (chain + address, or `spaceId:slug`) so invalidation hits only the affected query.

<sub>Source: <a href="examples/general/gateway-hooks.md#rtk-04-scope-cache-tags-per-id">examples/general/gateway-hooks.md#rtk-04-scope-cache-tags-per-id</a></sub>

</details>

---

## 🌐 general › security

<a id="sec-02"></a>
### `SEC-02` Gate destructive operations on a confirmed cause

> **general** · security · 2 examples · ↩ `RL-20260528-001` · `RL-20260720-003` · `RL-20260730-001` · `RL-20260828-001` · `RL-20260917-001` · `RL-20260930-004` · `RL-20260928-002`

**📜 Rule**\
Irreversible operations (deleting a key, wiping a signer, removing persisted data) run only on their specific confirmed cause, never on a falsy result or any caught error; a helper that returns `undefined` for both cancellation and true loss distinguishes them and keeps the error path for the ambiguous case. Existing data stays until its replacement is durably stored. A loading, failed, or skipped read (an empty config list, a `''` chainId) is unknown, not empty: wholesale writes and removals wait for a successful read, enforced in the shared write hook, and a terminal status (deleted) needs its definitive signal.

**✅ Check**\
> Did this add a destructive or wholesale-replacing write? If yes, does it fire only on its confirmed cause, keep existing data until the replacement is committed, and wait for a successful read rather than treating unknown as empty?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>sec-02-gate-destructive-operations-on-a-confirmed-cause</em></summary>

<br>

**SEC-02 — Gate destructive operations on a confirmed cause**

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

<sub>Source: <a href="examples/general/data-integrity.md#sec-02-gate-destructive-operations-on-a-confirmed-cause">examples/general/data-integrity.md#sec-02-gate-destructive-operations-on-a-confirmed-cause</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>sec-02-treat-an-unread-source-as-unknown-before-a-wholesale-write</em></summary>

<br>

**SEC-02 — Treat an unread source as unknown before a wholesale write**

Source: PR #8709, #8759 (RL-20260930-004)

### Avoid

```ts
return useMemo(() => {
  if (!stored) return EMPTY
  const chainIds = chains.map((chain) => chain.chainId) // [] while chains load or fail
  return stored.data.map((item) => ({ ...item, chainIds }))
}, [stored, chains])

const { currentData } = useEntriesQuery(args) // a failed read looks like an empty list
```

### Prefer

```ts
return useMemo(() => {
  if (!stored) return EMPTY
  if (chains.length === 0) return stored.data // keep stored values until the config is known
  const chainIds = chains.map((chain) => chain.chainId)
  return stored.data.map((item) => ({ ...item, chainIds }))
}, [stored, chains])

// inside the shared write hook, so every caller is covered
const { items, isLoading, isError } = useEntriesState()
if (isLoading || isError) return { error: SOURCE_UNAVAILABLE }
```

### Why

A loading, failed or skipped read and a config that has not arrived all look like "empty". When a write replaces a field wholesale, merging against that empty result silently erases what was stored. Keep stored values while the source is unknown, and refuse the write in the shared hook rather than relying on each button to disable itself.

<sub>Source: <a href="examples/general/data-integrity.md#sec-02-treat-an-unread-source-as-unknown-before-a-wholesale-write">examples/general/data-integrity.md#sec-02-treat-an-unread-source-as-unknown-before-a-wholesale-write</a></sub>

</details>

---

## 🌐 general › ci

<a id="ci-04"></a>
### `CI-04` Declare least-privilege workflow permissions explicitly

> **general** · ci · 1 example · ↩ `RL-20260526-001` · `RL-20260610-004` · `RL-20260824-003`

**📜 Rule**\
Every workflow declares a least-privilege `permissions:` block rather than inheriting the default token scope. Under workflow-level `permissions: {}`, every job that runs `actions/checkout` must re-declare `contents: read`, since the empty block removes the inherited scope and checkout otherwise fails.

**✅ Check**\
> Did this add a workflow or change token scopes? If yes, is there an explicit least-privilege block, and does every job that checks out the repo still get `contents: read`?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/api-and-packages.md</code> § <em>ci-04-grant-per-job-contents-read-under-empty-workflow-permissions</em></summary>

<br>

**CI-04 — Grant per-job contents read under empty workflow permissions**

Source: PR #7918 (RL-20260526-001)

### Avoid

```yaml
permissions: {} # least privilege at workflow level

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4 # fails: no contents:read inherited
```

### Prefer

```yaml
permissions: {}

jobs:
  lint:
    runs-on: ubuntu-latest
    permissions:
      contents: read # restore the minimal scope checkout needs
    steps:
      - uses: actions/checkout@v4
```

### Why

A top-level `permissions: {}` removes the inherited `contents: read` scope, so every job that runs `actions/checkout` fails with an insufficient-token-scope error until it re-declares the minimal permission. Add an explicit `permissions:` block (including `contents: read`) to each checkout job rather than widening the workflow-level scope back up.

<sub>Source: <a href="examples/general/api-and-packages.md#ci-04-grant-per-job-contents-read-under-empty-workflow-permissions">examples/general/api-and-packages.md#ci-04-grant-per-job-contents-read-under-empty-workflow-permissions</a></sub>

</details>

---

## 🌐 web › ui

<a id="a11y-01"></a>
### `A11Y-01` Keep interactive elements operable, unnested, and truly disabled

> **web** · ui · 2 examples · ↩ `RL-20260605-002` · `RL-20260605-006` · `RL-20260624-002` · `RL-20260624-003` · `RL-20260729-003` · `RL-20260805-001` · `RL-20260811-003` · `RL-20260921-006` · `RL-20260929-003`

**📜 Rule**\
Clickable elements are keyboard-operable (`<button type="button">`, or `role` + `tabIndex` + an Enter/Space handler) and never nested in another interactive element. Primitives that can render as links, and controls that must stay focusable for nested actions, disable with `aria-disabled` plus blocked pointer events. Repeated controls and indicators are named after their item, and a clickable row keeps its row role, uses a real button for focus, and ignores key events bubbled from nested controls.

**✅ Check**\
> Did this add or change a clickable element or shared interactive primitive? If yes, is it keyboard-operable and unnested, does its disabled state block and announce, and does each repeated control have a distinct accessible name?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>web/examples/feature-boundaries.md</code> § <em>disable-link-rendered-buttons-with-aria-disabled</em></summary>

<br>

**Disable link-rendered buttons with aria-disabled**

Source: PR #8014 (RL-20260605-002)

### Avoid

```ts
const buttonVariants = cva('... disabled:cursor-not-allowed disabled:opacity-50')
// <Button render={<a href={url} />} disabled /> still navigates
```

### Prefer

```ts
const buttonVariants = cva(
  '... disabled:cursor-not-allowed disabled:opacity-50 ' +
    'aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
)
```

### Why

Anchors ignore the `disabled` attribute, so a button rendered as a link looks disabled but still navigates unless `aria-disabled` blocks pointer events.

<sub>Source: <a href="web/examples/feature-boundaries.md#disable-link-rendered-buttons-with-aria-disabled">web/examples/feature-boundaries.md#disable-link-rendered-buttons-with-aria-disabled</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>web/examples/feature-boundaries.md</code> § <em>a11y-01-name-repeated-controls-after-their-item</em></summary>

<br>

**A11Y-01 — Name repeated controls after their item**

Source: PR #8611, #8735 (RL-20260929-003)

### Avoid

```tsx
getRowAriaLabel: ({ item }) => `Open ${item.type} details`

<Button variant="outline" onClick={onClick}>
  Set policy
</Button>
```

### Prefer

```tsx
getRowAriaLabel: ({ item }) => `Open ${getItemLabel(item)} for ${shortenAddress(item.address)}`

<Button variant="outline" onClick={onClick} aria-label={`Set policy for ${title}`}>
  Set policy
</Button>
```

### Why

A screen reader that lists controls by name cannot tell apart rows or tiles that all announce the same text. Put the item into the accessible name of every repeated control or indicator.

<sub>Source: <a href="web/examples/feature-boundaries.md#a11y-01-name-repeated-controls-after-their-item">web/examples/feature-boundaries.md#a11y-01-name-repeated-controls-after-their-item</a></sub>

</details>

---

## 🌐 general › security

<a id="sec-03"></a>
### `SEC-03` Allowlist backend-supplied fund recipients before signing

> **general** · security · 1 example · ↩ `RL-20260608-006`

**📜 Rule**\
Transaction parameters that come back from a backend and get signed (refund/fee receiver, payee, spender) must be checked against a client-side allowlist on every signing path, rejecting on mismatch and reporting it to telemetry, so a compromised or misconfigured backend cannot redirect funds.

**✅ Check**\
> Does this sign or propose a transaction with a recipient, spender, or fee receiver supplied by a backend? If yes, is it checked against a client-side allowlist on every signer's path?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/transactions.md</code> § <em>allowlist-backend-supplied-receivers-before-signing</em></summary>

<br>

**Allowlist backend-supplied receivers before signing**

Source: PR #7714 (RL-20260608-006)

### Avoid

```ts
const { refundReceiver, ...fees } = (await fetchPreview(tx)).txData
return mergeIntoSafeTx(tx, { refundReceiver, ...fees })
```

### Prefer

```ts
const { refundReceiver, ...fees } = (await fetchPreview(tx)).txData
if (!TRUSTED_RECEIVERS.some((a) => sameAddress(a, refundReceiver))) {
  trackError(Errors.UNTRUSTED_RECEIVER, `Untrusted receiver ${refundReceiver} on ${chainId}`)
  throw new Error('Refusing to sign: untrusted receiver')
}
return mergeIntoSafeTx(tx, { refundReceiver, ...fees })
```

### Why

A compromised or misconfigured backend could otherwise redirect funds through a value every signer approves without seeing; telemetry surfaces a rotated collector address.

<sub>Source: <a href="examples/general/transactions.md#allowlist-backend-supplied-receivers-before-signing">examples/general/transactions.md#allowlist-backend-supplied-receivers-before-signing</a></sub>

</details>

---

## 🌐 general › types

<a id="type-01"></a>
### `TYPE-01` Keep types honest instead of casting

> **general** · types · 1 example · ↩ `RL-20260608-012` · `RL-20260609-002` · `RL-20260622-002` · `RL-20260624-010` · `RL-20260702-002` · `RL-20260713-005` · `RL-20260720-001` · `RL-20260722-004` · `RL-20260731-003` · `RL-20260811-006` · `RL-20260828-002` · `RL-20261001-004` · `RL-20261002-004` · `RL-20261009-005`

**📜 Rule**\
Narrow unknown or wider values with a type predicate (`(x: unknown): x is T`), a guard, or a correctly typed source instead of `as T` casts or `@ts-ignore`; a cast silences the checker exactly where the value is unverified. Signatures state what they need: required inputs are not optional, and parameters are typed by the fields they read (`Pick<T, …>`). Branches on a discriminant end in a `never` check so a new kind fails to compile.

**✅ Check**\
> Did this add an `as` cast, `@ts-ignore`/`@ts-expect-error`, a function signature, or a branch on a discriminated union? If yes, could a predicate, guard, or correct type remove the cast, does the signature match what the function needs, and is the branch exhaustive?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>narrow-with-a-type-predicate-instead-of-repeating-casts</em></summary>

<br>

**Narrow with a type predicate instead of repeating casts**

Source: PR #7714 (RL-20260608-012)

### Avoid

```ts
const CODES: ReadonlyArray<Code> = ['A', 'B']
if (!CODES.includes(code as Code)) return undefined
return new CodedError(code as Code, message)
```

### Prefer

```ts
const CODES: ReadonlyArray<Code> = ['A', 'B']
const isCode = (c: unknown): c is Code => CODES.includes(c as Code)

if (!isCode(code)) return undefined
return new CodedError(code, message)
```

### Why

`includes(x as T)` doesn't narrow `x`, so every later use needs another cast; the predicate narrows once and keeps the one unavoidable cast in a single place.

<sub>Source: <a href="examples/general/data-integrity.md#narrow-with-a-type-predicate-instead-of-repeating-casts">examples/general/data-integrity.md#narrow-with-a-type-predicate-instead-of-repeating-casts</a></sub>

</details>

---

## 🌐 general › state

<a id="hook-01"></a>
### `HOOK-01` Scope hook dependencies to the real trigger with stable references

> **general** · state · 2 examples · ↩ `RL-20260605-010` · `RL-20260615-006` · `RL-20260611-008` · `RL-20260624-011` · `RL-20260701-001` · `RL-20260716-004` · `RL-20260813-001` · `RL-20260908-001` · `RL-20260930-007` · `RL-20261008-001`

**📜 Rule**\
Effect and memo dependencies name the value that should trigger the work, not a whole collection it iterates, a stand-in such as its `length` that misses same-size changes, or fast-changing overlay state (selection, hover) of an expensive memo; split a structural memo from a cheap overlay memo. Callbacks, fallbacks, and context values passed into deps or providers are referentially stable: `useCallback`/`useMemo` in the parent, and empty fallbacks (`?? []`, `?? {}`) as module-level constants.

**✅ Check**\
> Did this add or change `useEffect`/`useMemo`/`useCallback` dependencies (including under a suppressed `exhaustive-deps`), or pass a callback or `??` fallback into them? If yes, is every retriggering value listed, and does each dep change exactly when the work should re-run?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>stabilize-callbacks-passed-into-child-effect-deps</em></summary>

<br>

**Stabilize callbacks passed into child effect deps**

Source: PR #8002 (RL-20260611-008)

### Avoid

```tsx
// parent
;<Child
  onSelect={(address, name) => {
    setValue('id', address)
    setValue('name', name)
  }}
/>

// child
useEffect(() => {
  if (resolved) onSelect(resolved, '')
}, [resolved, onSelect])
```

### Prefer

```tsx
// parent
const handleSelect = useCallback(
  (address: string, name: string) => {
    setValue('id', address)
    setValue('name', name)
  },
  [setValue],
)

<Child onSelect={handleSelect} />
```

### Why

An inline callback is a new reference on every parent render, so the child's effect, and any `setValue`/validation it triggers, re-runs each time.

<sub>Source: <a href="examples/general/data-integrity.md#stabilize-callbacks-passed-into-child-effect-deps">examples/general/data-integrity.md#stabilize-callbacks-passed-into-child-effect-deps</a></sub>

</details>

<details>
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/data-integrity.md</code> § <em>hook-01-key-effect-deps-on-identifying-values-not-a-count</em></summary>

<br>

**HOOK-01 — Key effect deps on identifying values, not a count**

Source: PR #8981 (RL-20261008-001)

### Avoid

```tsx
const items = scope?.entity?.items // new array on every poll

useEffect(() => {
  // rebuild when the items change
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [sdk, items?.length])
```

### Prefer

```tsx
const itemsKey = items?.map((item) => item.value.toLowerCase()).join(',')

useEffect(() => {
  // rebuild when the items change
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [sdk, itemsKey])
```

### Why

A length stands in for the collection only until one entry is swapped for another; the count stays the same and the effect never re-runs. A key built from the identifying values stays stable across polls and changes exactly when the content does.

<sub>Source: <a href="examples/general/data-integrity.md#hook-01-key-effect-deps-on-identifying-values-not-a-count">examples/general/data-integrity.md#hook-01-key-effect-deps-on-identifying-values-not-a-count</a></sub>

</details>

---

## 🌐 general › testing

<a id="test-06"></a>
### `TEST-06` Tests must not leak state into other tests

> **general** · testing · ↩ `RL-20260615-012` · `RL-20260611-002` · `RL-20260806-002` · `RL-20260811-005` · `RL-20260820-003`

**📜 Rule**\
Tests that assign to globals (`navigator`, `window`, `Date`, env) restore them, via `jest.spyOn` + restore or save/restore in `afterEach`/`afterAll`. Only state that survives `beforeEach` leaks: `*Once` queues and unreset module state; a `beforeEach` that re-sets `mockReturnValue` already isolates per-test implementations.

**✅ Check**\
> Did this test mutate a global or module-level state? If yes, is it restored so test order cannot change the outcome?

---

## 🌐 general › packages

<a id="pkg-02"></a>
### `PKG-02` Import only declared dependencies, through their public entrypoint

> **general** · packages · ↩ `RL-20260610-001` · `RL-20260618-001` · `RL-20260629-001` · `RL-20260708-001` · `RL-20260729-001` · `RL-20260413-006` · `RL-20261009-001`

**📜 Rule**\
App and package code imports only packages declared in its own `package.json`, through the package's public entrypoint (the same module tree its provider uses, React Native on mobile), and uses the repo's established library for a concern (e.g. ethers) rather than one present only transitively. A package, its tests and stories included, never imports from an app (`@/…`) and carries its own test utils. A new package needs a reason existing dependencies cannot cover, and third-party versions never bypass the dependency age gate (`npmPreapprovedPackages` is for in-house `@safe-global/*` only).

**✅ Check**\
> Did this import a package or add a dependency? If yes, is it declared by this workspace, the library the repo already uses for that job, and imported through the entrypoint its provider uses, and does package code import nothing from an app?

---

## 🌐 general › security

<a id="sec-04"></a>
### `SEC-04` Keep secrets and raw identifiers out of logs and telemetry

> **general** · security · ↩ `RL-20260707-001` · `RL-20260914-001`

**📜 Rule**\
Logs, error reports, and telemetry never include raw URIs, deep links, or payloads that can carry secrets (WalletConnect symKeys, tokens, signatures). Log a redacted form such as the scheme or first path segment, and send errors with the sanitized message and a sanitized or omitted stack, since raw provider messages embed addresses, hashes, and calldata.

**✅ Check**\
> Did this log, report, or track a URI, deep link, request payload, or error? If yes, is anything secret-bearing or raw redacted or sanitized first?

---

## 🌐 general › forms

<a id="form-01"></a>
### `FORM-01` Form values track what inputs show and what they depend on

> **general** · forms · 1 example · ↩ `RL-20260821-001` · `RL-20260818-004` · `RL-20260907-001` · `RL-20260930-007`

**📜 Rule**\
An unfinished or invalid entry never maps to the empty form value; store an invalid sentinel or set a field error so submit stays blocked. When a field's dependency changes (selected token, signer list), clear it explicitly (RHF `resetField` restores the registered default) and give it a validation rule that re-runs. React to user edits in change handlers, since effects on a watched value also fire on `reset()`/`setValue`. A lookup-based `validate` fails on a miss, and edit-form options include every stored value.

**✅ Check**\
> Did this add or change a form field, a dependent field, or a reaction to a watched value? If yes, does the form value match what the input shows, is the dependent field cleared and revalidated, do edit reactions fire only on user input, and do lookup validators fail on a miss and edit options include stored values?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>clear-dependent-form-fields-with-setvalue-not-resetfield</em></summary>

<br>

**Clear dependent form fields with setValue, not resetField**

Source: PR #8539 (RL-20260821-001)

### Avoid

```ts
const onChangeToken = () => {
  resetField(amountField, '') // second arg is options; restores the registered default
}
```

### Prefer

```ts
const onChangeToken = () => {
  setValue(amountField, '', { shouldValidate: true })
}
```

### Why

`resetField` restores the registered default, which multi-step flows re-seed from the previous step, so the stale amount comes back.

<sub>Source: <a href="examples/general/data-integrity.md#clear-dependent-form-fields-with-setvalue-not-resetfield">examples/general/data-integrity.md#clear-dependent-form-fields-with-setvalue-not-resetfield</a></sub>

</details>

---

## 🌐 web › testing

<a id="test-07"></a>
### `TEST-07` Visual changes get a Storybook state

> **web** · testing · ↩ `RL-20260827-001` · `RL-20260911-005` · `RL-20260921-008` · `RL-20260930-012`

**📜 Rule**\
A new visible component or state, and every visual or layout bug fix, gets a Storybook story rendering that state (error, long content, nesting, dismissed) so the visual-regression run catches a recurrence; class-string snapshots and DOM unit tests don't verify geometry. Stories rely on the global `mswLoader` from the preview and never register it locally, pass callbacks as `fn()`, and apply a scenario decorator once per story (meta and story decorators stack).

**✅ Check**\
> Did this add a visible component or state, or fix a visual/layout bug? If yes, is there a story rendering exactly that state, including long, empty, and loading content, with one decorator per story?

---

## 🌐 general › performance

<a id="perf-02"></a>
### `PERF-02` Bound request fan-out and polling

> **general** · performance · ↩ `RL-20260930-006` · `RL-20261002-008`

**📜 Rule**\
A list does not fire one query per row or Workspace on render: fetch when the item's menu or detail opens, or use a narrower lookup, and error fallbacks send no more requests than the happy path. Polling stops once the result settles or times out; polling a shared cache key re-polls for every subscriber, so rows read their slice through `selectFromResult`.

**✅ Check**\
> Did this put a query in a list row or loop, fan requests out per entity, or poll? If yes, is the request count bounded by what the user opened, does polling stop, and does each row subscribe only to its slice?

---

## 🌐 general › security

<a id="sec-05"></a>
### `SEC-05` Gate actions on the identity the backend authorizes

> **general** · security · ↩ `RL-20260925-004`

**📜 Rule**\
Enable an action by the exact permission the backend enforces (the grant's delegator, not any owner of the Safe), and refuse when the acting identity's own record is missing instead of falling back to another entry (`list[0]`), which signs a request on someone else's behalf.

**✅ Check**\
> Does this enable an action or build a signed request for a specific identity? If yes, is it gated on the backend's exact permission, and does a missing record refuse rather than fall back?

---
