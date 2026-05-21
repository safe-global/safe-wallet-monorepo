# Engineering Rules

> Generated from `rules.json`. Do not edit by hand; edit `rules.json`, then regenerate this file.

## 📑 Quick Index

| ID | Title | Group |
| --- | --- | --- |
| [`FEAT-01`](#feat-01) | Use feature public APIs across boundaries | web / features |
| [`FEAT-02`](#feat-02) | Give new features the standard boundary | web / features |
| [`CODE-01`](#code-01) | Extract shared UI only when behavior is actually shared | web / abstractions |
| [`CODE-02`](#code-02) | Extract repeated styling into named structure | web / abstractions |
| [`WEB-01`](#web-01) | Make auth/session effects hydration-aware | web / auth |
| [`WEB-02`](#web-02) | Keep deliberate logout distinct from session expiry | web / auth |
| [`WEB-03`](#web-03) | Use fresh server probes for auth transitions | web / auth |
| [`API-01`](#api-01) | Search consumers when removing public exports | general / api |
| [`API-02`](#api-02) | Make additive hook registration idempotent | general / api |
| [`API-03`](#api-03) | Do not hand-edit generated clients as durable source | general / api |
| [`RTK-01`](#rtk-01) | Handle RTK mutation results explicitly | general / state |
| [`RTK-02`](#rtk-02) | Choose loading flags by UX meaning | general / state |
| [`DATA-01`](#data-01) | Preserve chain scope in address-like merges | general / data |
| [`DATA-02`](#data-02) | Empty-state checks must include every visible collection | general / data |
| [`DATA-03`](#data-03) | Preserve fallback data when adding new response shapes | general / data |
| [`DATA-04`](#data-04) | Normalize through existing bounded helpers | general / data |
| [`CHAIN-01`](#chain-01) | Resolve contracts from actual deployment data | general / chain |
| [`CHAIN-02`](#chain-02) | Gate multichain UI with compatibility state | web / chain |
| [`STATE-01`](#state-01) | Do not erase session-scoped discoveries on repeat actions | mobile / state |
| [`MOB-01`](#mob-01) | Open system settings only from explicit controls | mobile / permissions |
| [`MOB-02`](#mob-02) | Branch permission UX on the actual permission outcome | mobile / permissions |
| [`MOB-03`](#mob-03) | Use the React Native package entrypoint | mobile / dependencies |
| [`E2E-01`](#e2e-01) | Target E2E selectors unambiguously | web / e2e |
| [`TEST-01`](#test-01) | Assertions must fail on the regression they claim to cover | general / testing |
| [`TEST-02`](#test-02) | New branch logic needs branch-specific tests | general / testing |
| [`TEST-03`](#test-03) | Test the pure transformation separately from orchestration | general / testing |
| [`TEST-04`](#test-04) | Moved behavior needs replacement coverage | general / testing |
| [`TX-01`](#tx-01) | Preserve immutable transaction identity | web / transactions |
| [`TX-02`](#tx-02) | Submit option state must stay switchable and recoverable | web / transactions |
| [`UX-01`](#ux-01) | Constrained text must truncate or wrap intentionally | web / ui |
| [`UX-02`](#ux-02) | Local rows need local actions | web / ui |
| [`OBS-01`](#obs-01) | Promote telemetry only when user impact justifies it | web / observability |
| [`CACHE-01`](#cache-01) | Cache stable negative lookups deliberately | general / cache |
| [`CI-01`](#ci-01) | Scope CI concurrency and generated labels to the real target | general / ci |
| [`SEC-01`](#sec-01) | Use own-property checks for user-controlled map keys | web / security |
| [`DOC-01`](#doc-01) | Preserve guidance when splitting docs | general / docs |
| [`DOC-02`](#doc-02) | Operational docs must name real branches and fallback paths | general / docs |
| [`PROD-01`](#prod-01) | Product behavior changes need explicit confirmation | general / product |
| [`WEB-04`](#web-04) | Build Safe-scoped navigation from loaded Safe state | web / navigation |
| [`MOB-04`](#mob-04) | Keep Expo router layouts structural | mobile / navigation |
| [`WEB-05`](#web-05) | Sanitize auth redirects and outcomes | web / auth |
| [`FEAT-03`](#feat-03) | Do not self-import feature barrels | web / features |
| [`UI-01`](#ui-01) | Use theme tokens and hosted assets | general / ui |
| [`CI-02`](#ci-02) | Release workflows must compute against the pre-change state | general / ci |
| [`MOB-05`](#mob-05) | Configure mobile providers from app state and supported config | mobile / providers |
| [`CONFIG-01`](#config-01) | Match env-var default values to consumer parsers | web / config |
| [`UX-03`](#ux-03) | Shell rewrites must port over user-relied UX features | web / ui |
| [`PKG-01`](#pkg-01) | Do not duplicate shared package files in app source | general / packages |
| [`UI-02`](#ui-02) | Pick z-index from a documented layer scale | web / ui |
| [`REVIEW-01`](#review-01) | Don't bundle unrelated refactors with infra/test PRs | general / review |
| [`STATE-02`](#state-02) | Reset context state when its precondition flips | general / state |
| [`TEST-05`](#test-05) | Pick the right test fixture surface: builders for unit tests, MSW fixtures for integration | web / testing |
| [`CODE-03`](#code-03) | Cap positional parameters; close over shared hook state | general / abstractions |
| [`CODE-04`](#code-04) | Compute once per render before the JSX, not inside it | general / abstractions |
| [`PERF-01`](#perf-01) | Hoist regex literals and stable JSX out of inner loops | general / performance |
| [`CODE-05`](#code-05) | Use named membership checks instead of long `!==` chains | general / abstractions |
| [`FEAT-04`](#feat-04) | Coordinate edits to shared UI primitives with in-flight design-system PRs | web / features |
| [`OBS-02`](#obs-02) | Telemetry user-context effects must handle the empty branch | general / observability |
| [`TX-03`](#tx-03) | Gate submit on token data readiness | web / transactions |
| [`TX-04`](#tx-04) | Guard transaction submission with a synchronous ref | web / transactions |
| [`NUM-01`](#num-01) | Avoid scientific notation when serializing decimal amounts | general / numerics |
| [`STATE-03`](#state-03) | Retry handlers must reset error state | general / state |
| [`DATA-05`](#data-05) | Compare addresses with the shared sameAddress helper | general / data |
| [`MOB-07`](#mob-07) | Mount navigators before running navigation effects | mobile / navigation |
| [`TX-05`](#tx-05) | Centralize transaction-derived analyses in SafeShield | web / transactions |
| [`RTK-03`](#rtk-03) | Match RTK Query cache-key strings to the serialized form | general / state |
| [`WEB-06`](#web-06) | Derive reactive parent state from the store, not from child refs | web / state |
| [`MOB-06`](#mob-06) | Forward auto theme to native APIs as null | mobile / theme |
| [`E2E-02`](#e2e-02) | Pass timeout to the Cypress retryable command, not the assertion | web / e2e |
| [`DATA-06`](#data-06) | Keep cache-key normalization consistent across all consumers | general / data |
| [`CHAIN-03`](#chain-03) | Pass canonical Safe versions through chain-aware deployment helpers | general / chain |
| [`CI-03`](#ci-03) | Codegen drift checks must catch untracked outputs and run against PR HEAD | general / ci |

---

## 🌐 web › features

<a id="feat-01"></a>
### `FEAT-01` Use feature public APIs across boundaries

> **web** · features · 1 example · ↩ `RL-20260225-001` · `RL-20260318-006` · `RL-20260326-001`

**📜 Rule**\
Feature code must import another feature through its public API, not through deep internal component, hook, service, data, or generated paths.

**✅ Check**\
> Did this change cross a feature boundary? If yes, are imports going through the target feature's public API?

<details>
<summary><strong>💡 Example</strong> — <code>web/examples/feature-boundaries.md</code> § <em>feature-public-api</em></summary>

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

---

<a id="feat-02"></a>
### `FEAT-02` Give new features the standard boundary

> **web** · features · 1 example · ↩ `RL-20260227-001` · `RL-20260327-004`

**📜 Rule**\
New web features need an explicit boundary: public barrel, feature contract or handle where applicable, public types, and hooks exported without lazy-loading hook calls.

**✅ Check**\
> Did this add or expand a feature? If yes, does it have the expected public API boundary instead of making consumers import internals?

<details>
<summary><strong>💡 Example</strong> — <code>web/examples/feature-boundaries.md</code> § <em>feature-public-api</em></summary>

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

---

## 🌐 web › abstractions

<a id="code-01"></a>
### `CODE-01` Extract shared UI only when behavior is actually shared

> **web** · abstractions · 4 examples · ↩ `RL-20260227-002` · `RL-20260318-011` · `RL-20260327-006` · `RL-20260331-006` · `RL-20260505-006` · `RL-20260505-011`

**📜 Rule**\
When two components share form, state, loading, and error flow, prefer one configurable component over near-duplicate implementations.

**✅ Check**\
> Did this add a component that mirrors an existing workflow? If yes, can the existing component accept the small differences as props?

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

> **web** · abstractions · 3 examples · ↩ `RL-20260316-001` · `RL-20260318-003` · `RL-20260413-003` · `RL-20260424-001`

**📜 Rule**\
Repeated or long styling patterns should move into a small component, class helper, or CSS module when that makes call sites readable and consistent.

**✅ Check**\
> Did this repeat a long class list, shadow, or layout pattern? If yes, should it be named once and reused?

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
### `WEB-01` Make auth/session effects hydration-aware

> **web** · auth · 1 example · ↩ `RL-20260420-002` · `RL-20260504-001` · `RL-20260506-002` · `RL-20260520-001`

**📜 Rule**\
Effects that depend on persisted auth state must observe hydration or the relevant hydrated value instead of capturing initial empty state forever.

**✅ Check**\
> Did this effect read persisted auth/session state? If yes, does it re-run after hydration or depend on the hydrated value?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/gateway-hooks.md</code> § <em>hydration-aware-effects</em></summary>

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

---

<a id="web-02"></a>
### `WEB-02` Keep deliberate logout distinct from session expiry

> **web** · auth · 1 example · ↩ `RL-20260506-004`

**📜 Rule**\
Logout flows must clear client auth state before navigation or otherwise suppress session-expired handling while logout is in flight.

**✅ Check**\
> Did this change logout, auth hydration, or credentialed 403 handling? If yes, can a deliberate logout race show a session-expired toast?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/gateway-hooks.md</code> § <em>logout-session-races</em></summary>

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

---

<a id="web-03"></a>
### `WEB-03` Use fresh server probes for auth transitions

> **web** · auth · 2 examples · ↩ `RL-20260324-001` · `RL-20260407-005` · `RL-20260413-001`

**📜 Rule**\
Auth reconciliation and login/logout callbacks must not rely on cached RTK Query data when the backend cookie state is the source of truth.

**✅ Check**\
> Did this check current auth after a login/logout/callback transition? If yes, does it force a fresh backend probe and avoid a lingering subscription?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/gateway-hooks.md</code> § <em>fresh-auth-probes</em></summary>

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
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/gateway-hooks.md</code> § <em>web-03-force-unauthenticated-on-transient-reconcile-errors</em></summary>

<br>

**WEB-03 — Force unauthenticated on transient reconcile errors**

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

<sub>Source: <a href="examples/general/gateway-hooks.md#web-03-force-unauthenticated-on-transient-reconcile-errors">examples/general/gateway-hooks.md#web-03-force-unauthenticated-on-transient-reconcile-errors</a></sub>

</details>

---

## 🌐 general › api

<a id="api-01"></a>
### `API-01` Search consumers when removing public exports

> **general** · api · 1 example · ↩ `RL-20260410-002` · `RL-20260428-003` · `RL-20260506-003`

**📜 Rule**\
Removing or changing a public export, hook return field, endpoint, or compatibility API requires updating all tests and consumers in the same change.

**✅ Check**\
> Did this remove or rename an exported API? If yes, were tests, namespace imports, dynamic access, generated consumers, and downstream apps searched?

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

> **general** · api · 1 example · ↩ `RL-20260506-005`

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

> **general** · api · 2 examples · ↩ `RL-20260219-001` · `RL-20260219-004` · `RL-20260415-008`

**📜 Rule**\
Generated gateway files must come from schema/codegen. Temporary hand edits need an explicit generator path or they will be overwritten.

**✅ Check**\
> Did this touch AUTO_GENERATED or schema-derived files? If yes, can codegen reproduce the change?

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

> **general** · state · 2 examples · ↩ `RL-20260407-004` · `RL-20260505-004`

**📜 Rule**\
RTK Query mutation triggers resolve with a result object; use `.unwrap()` or inspect `result.error` before updating success UI or local state.

**✅ Check**\
> Did this call an RTK mutation? If yes, does success state happen only after confirmed success?

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
### `RTK-02` Choose loading flags by UX meaning

> **general** · state · 2 examples · ↩ `RL-20260302-005` · `RL-20260415-006` · `RL-20260420-001`

**📜 Rule**\
`isLoading` represents the first load; `isFetching` also covers refetches. Use the flag that matches whether existing data should remain visible.

**✅ Check**\
> Did this show a spinner from RTK Query state? If yes, should refetch hide existing content or only the initial load?

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

> **general** · data · 2 examples · ↩ `RL-20260223-001` · `RL-20260313-010` · `RL-20260323-001` · `RL-20260415-003` · `RL-20260505-002` · `RL-20260505-005`

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

> **general** · data · 3 examples · ↩ `RL-20260310-011` · `RL-20260318-009` · `RL-20260409-001`

**📜 Rule**\
When upstream responses gain a new shape, merge field-by-field and preserve legacy fallback mappings for omitted optional sections.

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
### `DATA-04` Normalize through existing bounded helpers

> **general** · data · 2 examples · ↩ `RL-20260220-003` · `RL-20260331-002` · `RL-20260402-002` · `RL-20260416-001` · `RL-20260423-001`

**📜 Rule**\
Values with established length, version, or encoding limits must go through the existing helper rather than duplicating raw serialization.

**✅ Check**\
> Did this create a tx origin, encoded note, Safe version, or similar bounded value? If yes, did it use the canonical helper?

<details>
<summary><strong>💡 Example 1 of 2</strong> — <code>examples/general/chain-contracts.md</code> § <em>normalize-versions-and-origin</em></summary>

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
<summary><strong>💡 Example 2 of 2</strong> — <code>examples/general/testing.md</code> § <em>match-real-gateway-response-shapes-when-intercepting</em></summary>

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

---

## 🌐 general › chain

<a id="chain-01"></a>
### `CHAIN-01` Resolve contracts from actual deployment data

> **general** · chain · 1 example · ↩ `RL-20260423-001` · `RL-20260423-002` · `RL-20260428-001`

**📜 Rule**\
Contract and chain compatibility logic should derive from Safe version, master copy, chain ID, and safe-deployments data rather than broad chain flags or naive set differences.

**✅ Check**\
> Did this choose a contract address or available chain? If yes, is it based on actual deployment/compatibility data and covered for both web and mobile callers?

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

> **web** · chain · 1 example · ↩ `RL-20260402-001` · `RL-20260428-001` · `RL-20260428-002`

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
### `MOB-01` Open system settings only from explicit controls

> **mobile** · permissions · 1 example · ↩ `RL-20260505-006` · `RL-20260506-001`

**📜 Rule**\
Permission-denied flows must open system Settings only from a clearly labeled user-tapped control, not from wrapper taps or automatic denial handling.

**✅ Check**\
> Did this permission flow call `Linking.openSettings` or an equivalent API? If yes, is that path reachable only from the explicit Settings button?

<details>
<summary><strong>💡 Example</strong> — <code>mobile/examples/permissions.md</code> § <em>explicit-settings-navigation</em></summary>

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

---

<a id="mob-02"></a>
### `MOB-02` Branch permission UX on the actual permission outcome

> **mobile** · permissions · 1 example · ↩ `RL-20260505-001`

**📜 Rule**\
Permission-denied explainers must run only for actual denial/restriction outcomes, not for unrelated registration or network failures.

**✅ Check**\
> Did this permission request have multiple failure modes? If yes, does the Settings explainer branch on a permission result rather than any caught error?

<details>
<summary><strong>💡 Example</strong> — <code>mobile/examples/permissions.md</code> § <em>permission-denial-branches</em></summary>

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

## 🌐 mobile › dependencies

<a id="mob-03"></a>
### `MOB-03` Use the React Native package entrypoint

> **mobile** · dependencies · ↩ `RL-20260413-006`

**📜 Rule**\
Mobile overrides of third-party UI must import from the same React Native module tree as the provider to avoid duplicate contexts or theme state.

**✅ Check**\
> Did this import from a package internals path? If yes, does it match the React Native entrypoint used by the provider?

---

## 🌐 web › e2e

<a id="e2e-01"></a>
### `E2E-01` Target E2E selectors unambiguously

> **web** · e2e · 2 examples · ↩ `RL-20260225-002` · `RL-20260331-004` · `RL-20260409-002` · `RL-20260409-003` · `RL-20260413-002`

**📜 Rule**\
Cypress helpers must target the intended control by stable accessible label, test ID, or scoped container when copy is shared by multiple buttons.

**✅ Check**\
> Did this update an E2E selector? If yes, can another visible control with similar copy be clicked instead?

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

> **general** · testing · 5 examples · ↩ `RL-20260217-001` · `RL-20260218-004` · `RL-20260303-010` · `RL-20260318-002` · `RL-20260331-005` · `RL-20260408-001` · `RL-20260408-002` · `RL-20260409-002` · `RL-20260423-002` · `RL-20260506-006`

**📜 Rule**\
Assertions and fixtures must fail loudly when the behavior or fixture data they rely on disappears.

**✅ Check**\
> Did this add or update a test assertion? If yes, would it fail if the bug reappeared or fixture data vanished?

<details>
<summary><strong>💡 Example 1 of 5</strong> — <code>examples/general/testing.md</code> § <em>negative-assertions</em></summary>

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
<summary><strong>💡 Example 2 of 5</strong> — <code>examples/general/testing.md</code> § <em>test-01-assert-the-specific-behavior-the-description-claims</em></summary>

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
<summary><strong>💡 Example 3 of 5</strong> — <code>examples/general/testing.md</code> § <em>test-01-mock-external-lookups-instead-of-relying-on-real-fixture-state</em></summary>

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
<summary><strong>💡 Example 4 of 5</strong> — <code>examples/general/testing.md</code> § <em>test-01-test-the-debounce-not-just-the-post-debounce-assertion</em></summary>

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
<summary><strong>💡 Example 5 of 5</strong> — <code>examples/general/testing.md</code> § <em>overwriting-localstorage-fixtures-must-include-implicit-app-seeded-entries</em></summary>

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

---

<a id="test-02"></a>
### `TEST-02` New branch logic needs branch-specific tests

> **general** · testing · 1 example · ↩ `RL-20260318-001` · `RL-20260324-001` · `RL-20260327-004` · `RL-20260407-001` · `RL-20260417-001` · `RL-20260420-002` · `RL-20260428-002` · `RL-20260429-001` · `RL-20260430-001` · `RL-20260430-002` · `RL-20260504-001` · `RL-20260505-002` · `RL-20260505-006` · `RL-20260506-002`

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

> **general** · testing · 2 examples · ↩ `RL-20260317-003` · `RL-20260318-005` · `RL-20260413-007`

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
### `TEST-04` Moved behavior needs replacement coverage

> **general** · testing · ↩ `RL-20260428-002` · `RL-20260428-003`

**📜 Rule**\
When logic moves from one hook/component to another, removed tests must be replaced at the new owner and consumer mocks must match real prop contracts.

**✅ Check**\
> Did this move or remove a return field, prop, or branch? If yes, did equivalent tests move to the new owner?

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
### `TX-02` Submit option state must stay switchable and recoverable

> **web** · transactions · ↩ `RL-20260417-002`

**📜 Rule**\
Tx-flow submit options must not auto-register or set global state in a way that hides alternatives, and submit errors must reset loading state instead of throwing out of the flow.

**✅ Check**\
> Did this add or auto-select a tx-flow submit option? If yes, can the user switch away and can failures reset loading state?

---

## 🌐 web › ui

<a id="ux-01"></a>
### `UX-01` Constrained text must truncate or wrap intentionally

> **web** · ui · ↩ `RL-20260217-005` · `RL-20260219-002` · `RL-20260506-001`

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

> **web** · observability · 1 example · ↩ `RL-20260319-001` · `RL-20260417-003`

**📜 Rule**\
Observability changes should distinguish warning-level noise from user-impacting errors and avoid flooding SLOs with expected retries, browser noise, or duplicate signals.

**✅ Check**\
> Did this change logging/RUM/error classification? If yes, is the level justified by user impact and duplication risk?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/api-and-packages.md</code> § <em>obs-01-use-the-shared-analytics-param-key</em></summary>

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

---

## 🌐 general › cache

<a id="cache-01"></a>
### `CACHE-01` Cache stable negative lookups deliberately

> **general** · cache · ↩ `RL-20260420-003`

**📜 Rule**\
Repeated negative lookups that are expected and stable should be cached with clear TTL/invalidation; transient failures must not be cached as permanent absence.

**✅ Check**\
> Did this resolver repeatedly query for absent data? If yes, is absence cached deliberately without making transient failures permanent?

---

## 🌐 general › ci

<a id="ci-01"></a>
### `CI-01` Scope CI concurrency and generated labels to the real target

> **general** · ci · 1 example · ↩ `RL-20260302-002` · `RL-20260318-008` · `RL-20260326-003` · `RL-20260407-002` · `RL-20260422-001`

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
### `DOC-01` Preserve guidance when splitting docs

> **general** · docs · ↩ `RL-20260303-008` · `RL-20260318-012` · `RL-20260408-003` · `RL-20260430-003`

**📜 Rule**\
When splitting or moving agent/developer docs, every removed section must be moved, intentionally superseded, or called out for review.

**✅ Check**\
> Did this split, delete, or move docs? If yes, can every removed section be accounted for in the new structure?

---

<a id="doc-02"></a>
### `DOC-02` Operational docs must name real branches and fallback paths

> **general** · docs · ↩ `RL-20260415-001`

**📜 Rule**\
Release and operational docs should describe actual branch names, generated branch patterns, and fallback actions rather than placeholders that look literal.

**✅ Check**\
> Did this edit release/runbook instructions? If yes, would a release manager know the real source branch and fallback command?

---

## 🌐 general › product

<a id="prod-01"></a>
### `PROD-01` Product behavior changes need explicit confirmation

> **general** · product · ↩ `RL-20260420-004`

**📜 Rule**\
Changes to visible balances, disabled actions, labels, or available flows should cite product/design intent when the behavior is not mechanically implied by the code change.

**✅ Check**\
> Did this alter visible product behavior? If yes, is the product/design decision explicit?

---

## 🌐 web › navigation

<a id="web-04"></a>
### `WEB-04` Build Safe-scoped navigation from loaded Safe state

> **web** · navigation · 2 examples · ↩ `RL-20260217-002` · `RL-20260402-001` · `RL-20260410-003` · `RL-20260429-002` · `RL-20260520-001`

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
### `MOB-04` Keep Expo router layouts structural

> **mobile** · navigation · ↩ `RL-20260217-004` · `RL-20260331-001`

**📜 Rule**\
Expo Router layout files should define shell/navigation structure; business cleanup, disconnect, validation, and navigation side effects belong in focused containers, hooks, or screen logic.

**✅ Check**\
> Did this add logic to an Expo Router `_layout.tsx` file? If yes, is it only structural shell code?

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

## 🌐 web › features

<a id="feat-03"></a>
### `FEAT-03` Do not self-import feature barrels

> **web** · features · 4 examples · ↩ `RL-20260220-002` · `RL-20260309-001` · `RL-20260309-005` · `RL-20260326-001`

**📜 Rule**\
Code inside a web feature must not import the feature barrel or lazy feature handle when a direct hook, constant, or feature flag check avoids a circular dependency.

**✅ Check**\
> Did this code inside `features/<name>` import from that feature barrel? If yes, can it import the direct module or shared hook instead?

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

## 🌐 general › ui

<a id="ui-01"></a>
### `UI-01` Use theme tokens and hosted assets

> **general** · ui · 1 example · ↩ `RL-20260219-003` · `RL-20260312-003` · `RL-20260317-001` · `RL-20260327-003` · `RL-20260327-005`

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
### `CONFIG-01` Match env-var default values to consumer parsers

> **web** · config · 1 example · ↩ `RL-20260326-005`

**📜 Rule**\
Default values for env-var-driven config must satisfy the same parser or strict check the runtime applies to non-default values. For origin allowlists, omit trailing slashes since browser-supplied origins are slashless.

**✅ Check**\
> Did this introduce or change an env-var default? If yes, run the default through the consuming check; would the strict path accept it without normalization?

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

## 🌐 web › ui

<a id="ux-03"></a>
### `UX-03` Shell rewrites must port over user-relied UX features

> **web** · ui · ↩ `RL-20260302-003` · `RL-20260318-010` · `RL-20260410-004`

**📜 Rule**\
When replacing a shared shell component (topbar, sidebar, layout, navigation chrome), do an explicit feature delta against the previous version. Carry forward icons, indicators, shortcuts, and entry points users have come to rely on; if you intentionally drop one, document the decision before merge.

**✅ Check**\
> Did this replace shared shell/chrome? If yes, can you list every feature/icon/control that disappeared, and is each removal a deliberate UX call?

---

## 🌐 general › packages

<a id="pkg-01"></a>
### `PKG-01` Do not duplicate shared package files in app source

> **general** · packages · 1 example · ↩ `RL-20260415-007`

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

> **web** · ui · ↩ `RL-20260317-002`

**📜 Rule**\
When introducing or adjusting a z-index, place it on a documented scale of existing app layers (drawers, popovers, dialogs, notifications) rather than inventing an isolated value, and justify the choice in a comment if it must sit between two known layers.

**✅ Check**\
> Does this z-index reference an existing documented layer or scale, or is it an arbitrary value?

---

## 🌐 general › review

<a id="review-01"></a>
### `REVIEW-01` Don't bundle unrelated refactors with infra/test PRs

> **general** · review · ↩ `RL-20260318-004`

**📜 Rule**\
A PR whose stated purpose is CI, tooling, or test-infrastructure should not also contain unrelated production refactors; reviewers should ask the author to split such changes into separate PRs.

**✅ Check**\
> Does this PR contain production-code changes outside its stated scope (test infra, CI, scaffolding)? If yes, split it.

---

## 🌐 general › state

<a id="state-02"></a>
### `STATE-02` Reset context state when its precondition flips

> **general** · state · 1 example · ↩ `RL-20260318-007`

**📜 Rule**\
When an effect writes derived values into a context based on a boolean precondition, the false branch must explicitly reset those values; do not rely on the next true branch to overwrite them.

**✅ Check**\
> Does this conditional context write also clear the values when the condition becomes false, so downstream consumers never see stale data?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>state-02-reset-context-state-when-its-precondition-flips</em></summary>

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

---

## 🌐 web › testing

<a id="test-05"></a>
### `TEST-05` Pick the right test fixture surface: builders for unit tests, MSW fixtures for integration

> **web** · testing · 1 example · ↩ `RL-20260313-002`

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
### `CODE-03` Cap positional parameters; close over shared hook state

> **general** · abstractions · 1 example · ↩ `RL-20260311-005`

**📜 Rule**\
Helper functions called from inside a hook should not take more than 4 positional parameters. When all extra args come from the same hook scope, prefer a local closure (`const buildItem = (chainId, address) => _buildSafeItem(chainId, address, ...deps)`) or a single `deps` object so call sites stay readable.

**✅ Check**\
> Static check: helpers invoked inside `useMemo`/`useCallback` with ≥5 positional args are flagged for review.

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

<a id="code-04"></a>
### `CODE-04` Compute once per render before the JSX, not inside it

> **general** · abstractions · 1 example · ↩ `RL-20260310-006`

**📜 Rule**\
Pure derivations from props or state — especially ones reused across multiple JSX nodes — should be assigned to a local `const` (or `useMemo` if expensive) above the `return`, not inlined into JSX attributes.

**✅ Check**\
> Lint review: flag identical pure-function calls appearing in multiple JSX `style`/attribute expressions within the same return.

<details>
<summary><strong>💡 Example</strong> — <code>web/examples/feature-boundaries.md</code> § <em>hoist-derived-values-out-of-jsx</em></summary>

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

## 🌐 general › performance

<a id="perf-01"></a>
### `PERF-01` Hoist regex literals and stable JSX out of inner loops

> **general** · performance · 1 example · ↩ `RL-20260312-007`

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
### `CODE-05` Use named membership checks instead of long `!==` chains

> **general** · abstractions · 1 example · ↩ `RL-20260312-008`

**📜 Rule**\
Three or more `value !== 'literal'` checks on the same variable should be rewritten as `!DISALLOWED.includes(value)` against a named const, and the resulting boolean assigned to a named variable before use in JSX.

**✅ Check**\
> Review: ≥3 `!== 'string-literal'` operands joined by `&&` on the same identifier should be rejected in favor of a named constant.

<details>
<summary><strong>💡 Example</strong> — <code>mobile/examples/permissions.md</code> § <em>name-the-warning-condition-do-not-chain</em></summary>

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

## 🌐 general › observability

<a id="obs-02"></a>
### `OBS-02` Telemetry user-context effects must handle the empty branch

> **general** · observability · 1 example · ↩ `RL-20260311-013`

**📜 Rule**\
Any effect that writes user/account context to a telemetry SDK must also clear or overwrite that context when the underlying entity becomes absent. The effect's dependency array must include the absence case, and the effect body must branch on it.

**✅ Check**\
> Review: `useEffect` calls that read `activeSafe?.address` to call `addUserExtraInfo`/`setUser`/`identify` should also call the corresponding reset API in the falsy branch.

<details>
<summary><strong>💡 Example</strong> — <code>mobile/examples/permissions.md</code> § <em>clear-telemetry-context-when-the-entity-becomes-null</em></summary>

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

---

## 🌐 web › transactions

<a id="tx-03"></a>
### `TX-03` Gate submit on token data readiness

> **web** · transactions · 1 example · ↩ `RL-20260303-002`

**📜 Rule**\
Block transaction submission until token decimals (or other parameters that affect the on-chain amount) are fully loaded. Never let the UI fall back to a default that silently corrupts the value.

**✅ Check**\
> Did this submit path depend on token metadata? If yes, is submission disabled until that metadata is confirmed loaded?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/transactions.md</code> § <em>gate-submit-on-token-data-readiness-never-fall-back-to-default-decimals</em></summary>

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

---

<a id="tx-04"></a>
### `TX-04` Guard transaction submission with a synchronous ref

> **web** · transactions · 1 example · ↩ `RL-20260303-003`

**📜 Rule**\
Use a synchronous ref (not a state flag) to prevent double-submission in transaction send flows. State updates are async and can race when the user double-clicks or presses Enter while a request is in flight.

**✅ Check**\
> Does this submit handler rely only on a state flag? If yes, switch to a useRef guard set/checked synchronously.

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/transactions.md</code> § <em>synchronous-ref-guard-against-double-submit</em></summary>

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

## 🌐 general › numerics

<a id="num-01"></a>
### `NUM-01` Avoid scientific notation when serializing decimal amounts

> **general** · numerics · 1 example · ↩ `RL-20260303-004`

**📜 Rule**\
When converting fiat or float values into bigint/decimal-string representations, format intermediate math without scientific notation. JS toString() emits '1e-7' for very small numbers, which downstream BigInt parsers reject.

**✅ Check**\
> Does this code convert a Number to a decimal string for on-chain use? If yes, is it formatted with toFixed/Decimal.js rather than implicit toString?

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
### `STATE-03` Retry handlers must reset error state

> **general** · state · 1 example · ↩ `RL-20260306-006`

**📜 Rule**\
When a user-initiated retry button calls an async operation, reset prior error state synchronously before re-issuing the call so the new attempt starts from a clean slate.

**✅ Check**\
> Does this retry handler clear the previous error before retrying? If not, stale error UI persists through the new attempt.

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>reset-error-state-in-retry-handlers</em></summary>

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

---

## 🌐 general › data

<a id="data-05"></a>
### `DATA-05` Compare addresses with the shared sameAddress helper

> **general** · data · 1 example · ↩ `RL-20260309-007`

**📜 Rule**\
Use the repo's `sameAddress(a, b)` helper for any address equality check. Direct string comparison silently fails on case/checksum differences; the helper normalizes both sides.

**✅ Check**\
> Did this introduce a `===` or `!==` between two address values? If yes, switch to `sameAddress`.

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>compare-addresses-with-sameaddress-not-tolowercase</em></summary>

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

## 🌐 general › state

<a id="rtk-03"></a>
### `RTK-03` Match RTK Query cache-key strings to the serialized form

> **general** · state · ↩ `RL-20260302-001`

**📜 Rule**\
Persisted RTK Query cache keys must be derived from the same serialization the runtime uses. Mismatched keys silently miss cache hits and refetch on every page load.

**✅ Check**\
> Does this code persist or restore an RTK cache key? If yes, does it use the same `serializeQueryArgs`/default key serializer the runtime uses?

---

## 🌐 web › state

<a id="web-06"></a>
### `WEB-06` Derive reactive parent state from the store, not from child refs

> **web** · state · ↩ `RL-20260302-004`

**📜 Rule**\
When a parent needs to react to changes inside a child component, drive that reactivity through Redux/store state rather than imperative refs. Refs don't trigger re-renders, so parent UI ends up stale.

**✅ Check**\
> Does the parent compute layout/visibility from a child ref? If yes, lift the relevant value into the store and read it from a selector.

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
### `E2E-02` Pass timeout to the Cypress retryable command, not the assertion

> **web** · e2e · 1 example · ↩ `RL-20260218-001`

**📜 Rule**\
Cypress retries the command, not the chained assertion, so timeouts must go on `cy.get(..., { timeout })`/`cy.contains(..., { timeout })` — passing timeout into `should()` or `expect()` does nothing.

**✅ Check**\
> Did this E2E test increase a timeout to handle async UI? Is the timeout on the retryable command rather than the trailing assertion?

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
### `DATA-06` Keep cache-key normalization consistent across all consumers

> **general** · data · 1 example · ↩ `RL-20260218-002`

**📜 Rule**\
When multiple consumers (selector, hook, persistence layer) build cache keys from the same identifier, they must all normalize identically (e.g. `getAddress`, `toLowerCase`, EIP-55 checksum). Divergent normalization fragments the cache.

**✅ Check**\
> Did this code add a new consumer that builds a cache key from an address/identifier? Does it normalize the same way as every existing consumer?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>normalize-rtk-query-cache-keys-at-one-place</em></summary>

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

---

## 🌐 general › chain

<a id="chain-03"></a>
### `CHAIN-03` Pass canonical Safe versions through chain-aware deployment helpers

> **general** · chain · ↩ `RL-20260218-003`

**📜 Rule**\
When resolving Safe contract metadata for a transaction, route the lookup through a chain-aware helper that respects canonical-fallback ordering. Hard-coding latest-version indices skips chains pinned to older releases.

**✅ Check**\
> Does this code resolve a Safe contract address/version? If yes, is it going through the canonical-version helper rather than picking from a flat list?

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
