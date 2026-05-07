# Engineering Rules

> Generated from `rules.json`. Do not edit by hand; edit `rules.json`, then regenerate this file.

## 📑 Quick Index

| ID                        | Title                                                          | Group                 |
| ------------------------- | -------------------------------------------------------------- | --------------------- |
| [`FEAT-01`](#feat-01)     | Use feature public APIs across boundaries                      | web / features        |
| [`FEAT-02`](#feat-02)     | Give new features the standard boundary                        | web / features        |
| [`CODE-01`](#code-01)     | Extract shared UI only when behavior is actually shared        | web / abstractions    |
| [`CODE-02`](#code-02)     | Extract repeated styling into named structure                  | web / abstractions    |
| [`WEB-01`](#web-01)       | Make auth/session effects hydration-aware                      | web / auth            |
| [`WEB-02`](#web-02)       | Keep deliberate logout distinct from session expiry            | web / auth            |
| [`WEB-03`](#web-03)       | Use fresh server probes for auth transitions                   | web / auth            |
| [`API-01`](#api-01)       | Search consumers when removing public exports                  | general / api         |
| [`API-02`](#api-02)       | Make additive hook registration idempotent                     | general / api         |
| [`API-03`](#api-03)       | Do not hand-edit generated clients as durable source           | general / api         |
| [`RTK-01`](#rtk-01)       | Handle RTK mutation results explicitly                         | general / state       |
| [`RTK-02`](#rtk-02)       | Choose loading flags by UX meaning                             | general / state       |
| [`DATA-01`](#data-01)     | Preserve chain scope in address-like merges                    | general / data        |
| [`DATA-02`](#data-02)     | Empty-state checks must include every visible collection       | general / data        |
| [`DATA-03`](#data-03)     | Preserve fallback data when adding new response shapes         | general / data        |
| [`DATA-04`](#data-04)     | Normalize through existing bounded helpers                     | general / data        |
| [`CHAIN-01`](#chain-01)   | Resolve contracts from actual deployment data                  | general / chain       |
| [`CHAIN-02`](#chain-02)   | Gate multichain UI with compatibility state                    | web / chain           |
| [`STATE-01`](#state-01)   | Do not erase session-scoped discoveries on repeat actions      | mobile / state        |
| [`MOB-01`](#mob-01)       | Open system settings only from explicit controls               | mobile / permissions  |
| [`MOB-02`](#mob-02)       | Branch permission UX on the actual permission outcome          | mobile / permissions  |
| [`MOB-03`](#mob-03)       | Use the React Native package entrypoint                        | mobile / dependencies |
| [`E2E-01`](#e2e-01)       | Target E2E selectors unambiguously                             | web / e2e             |
| [`TEST-01`](#test-01)     | Assertions must fail on the regression they claim to cover     | general / testing     |
| [`TEST-02`](#test-02)     | New branch logic needs branch-specific tests                   | general / testing     |
| [`TEST-03`](#test-03)     | Test the pure transformation separately from orchestration     | general / testing     |
| [`TEST-04`](#test-04)     | Moved behavior needs replacement coverage                      | general / testing     |
| [`TX-01`](#tx-01)         | Preserve immutable transaction identity                        | web / transactions    |
| [`TX-02`](#tx-02)         | Submit option state must stay switchable and recoverable       | web / transactions    |
| [`UX-01`](#ux-01)         | Constrained text must truncate or wrap intentionally           | web / ui              |
| [`UX-02`](#ux-02)         | Local rows need local actions                                  | web / ui              |
| [`OBS-01`](#obs-01)       | Promote telemetry only when user impact justifies it           | web / observability   |
| [`CACHE-01`](#cache-01)   | Cache stable negative lookups deliberately                     | general / cache       |
| [`CI-01`](#ci-01)         | Scope CI concurrency and generated labels to the real target   | general / ci          |
| [`SEC-01`](#sec-01)       | Use own-property checks for user-controlled map keys           | web / security        |
| [`DOC-01`](#doc-01)       | Preserve guidance when splitting docs                          | general / docs        |
| [`DOC-02`](#doc-02)       | Operational docs must name real branches and fallback paths    | general / docs        |
| [`PROD-01`](#prod-01)     | Product behavior changes need explicit confirmation            | general / product     |
| [`WEB-04`](#web-04)       | Build Safe-scoped navigation from loaded Safe state            | web / navigation      |
| [`MOB-04`](#mob-04)       | Keep Expo router layouts structural                            | mobile / navigation   |
| [`WEB-05`](#web-05)       | Sanitize auth redirects and outcomes                           | web / auth            |
| [`FEAT-03`](#feat-03)     | Do not self-import feature barrels                             | web / features        |
| [`UI-01`](#ui-01)         | Use theme tokens and hosted assets                             | general / ui          |
| [`CI-02`](#ci-02)         | Release workflows must compute against the pre-change state    | general / ci          |
| [`MOB-05`](#mob-05)       | Configure mobile providers from app state and supported config | mobile / providers    |
| [`CONFIG-01`](#config-01) | Match env-var default values to consumer parsers               | web / config          |
| [`UX-03`](#ux-03)         | Shell rewrites must port over user-relied UX features          | web / ui              |
| [`PKG-01`](#pkg-01)       | Do not duplicate shared package files in app source            | general / packages    |

---

## 🌐 web › features

<a id="feat-01"></a>

### `FEAT-01` Use feature public APIs across boundaries

> **web** · features · 1 example · ↩ `RL-20260326-001`

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

> **web** · features · 1 example · ↩ `RL-20260327-004`

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

> **web** · abstractions · 3 examples · ↩ `RL-20260327-006` · `RL-20260331-006` · `RL-20260505-006` · `RL-20260505-011`

**📜 Rule**\
When two components share form, state, loading, and error flow, prefer one configurable component over near-duplicate implementations.

**✅ Check**\

> Did this add a component that mirrors an existing workflow? If yes, can the existing component accept the small differences as props?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>web/examples/feature-boundaries.md</code> § <em>shared-form-components</em></summary>

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
<summary><strong>💡 Example 2 of 3</strong> — <code>web/examples/feature-boundaries.md</code> § <em>code-01-fold-near-duplicate-sign-in-buttons-into-one-configurable-component</em></summary>

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
<summary><strong>💡 Example 3 of 3</strong> — <code>web/examples/feature-boundaries.md</code> § <em>code-01-extract-embedded-error-boundaries-from-unrelated-ui-components</em></summary>

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

---

<a id="code-02"></a>

### `CODE-02` Extract repeated styling into named structure

> **web** · abstractions · 1 example · ↩ `RL-20260413-003` · `RL-20260424-001`

**📜 Rule**\
Repeated or long styling patterns should move into a small component, class helper, or CSS module when that makes call sites readable and consistent.

**✅ Check**\

> Did this repeat a long class list, shadow, or layout pattern? If yes, should it be named once and reused?

<details>
<summary><strong>💡 Example</strong> — <code>web/examples/feature-boundaries.md</code> § <em>repeated-style-shape</em></summary>

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

---

## 🌐 web › auth

<a id="web-01"></a>

### `WEB-01` Make auth/session effects hydration-aware

> **web** · auth · 1 example · ↩ `RL-20260420-002` · `RL-20260504-001` · `RL-20260506-002`

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

> **general** · api · 1 example · ↩ `RL-20260415-008`

**📜 Rule**\
Generated gateway files must come from schema/codegen. Temporary hand edits need an explicit generator path or they will be overwritten.

**✅ Check**\

> Did this touch AUTO_GENERATED or schema-derived files? If yes, can codegen reproduce the change?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/api-and-packages.md</code> § <em>api-03-import-from-package-public-entrypoints-not-deep-dist-paths</em></summary>

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

> **general** · state · 2 examples · ↩ `RL-20260415-006` · `RL-20260420-001`

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

> **general** · data · 1 example · ↩ `RL-20260415-003` · `RL-20260505-002` · `RL-20260505-005`

**📜 Rule**\
Address-book and Safe-like merge logic must compare entries at the relevant identity granularity, usually address plus chain ID.

**✅ Check**\

> Did this merge contacts, Safes, or address-scoped records? If yes, are non-overlapping chain IDs preserved?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>per-chain-contact-merges</em></summary>

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

---

<a id="data-02"></a>

### `DATA-02` Empty-state checks must include every visible collection

> **general** · data · 1 example · ↩ `RL-20260415-002` · `RL-20260505-003`

**📜 Rule**\
UI empty-state predicates must include every collection that can render tabs, rows, actions, or badges.

**✅ Check**\

> Did this add a new collection to a view? If yes, do empty states and tab visibility include it?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>data-02-empty-state-gating-across-multiple-collections</em></summary>

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

---

<a id="data-03"></a>

### `DATA-03` Preserve fallback data when adding new response shapes

> **general** · data · 1 example · ↩ `RL-20260409-001`

**📜 Rule**\
When upstream responses gain a new shape, merge field-by-field and preserve legacy fallback mappings for omitted optional sections.

**✅ Check**\

> Did this add support for a new response shape? If yes, do partial new payloads still preserve legacy data?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/data-integrity.md</code> § <em>fallback-preserving-maps</em></summary>

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

---

<a id="data-04"></a>

### `DATA-04` Normalize through existing bounded helpers

> **general** · data · 1 example · ↩ `RL-20260331-002` · `RL-20260402-002` · `RL-20260416-001` · `RL-20260423-001`

**📜 Rule**\
Values with established length, version, or encoding limits must go through the existing helper rather than duplicating raw serialization.

**✅ Check**\

> Did this create a tx origin, encoded note, Safe version, or similar bounded value? If yes, did it use the canonical helper?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/chain-contracts.md</code> § <em>normalize-versions-and-origin</em></summary>

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

> **web** · e2e · 2 examples · ↩ `RL-20260331-004` · `RL-20260409-002` · `RL-20260409-003` · `RL-20260413-002`

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

> **general** · testing · 3 examples · ↩ `RL-20260331-005` · `RL-20260408-001` · `RL-20260408-002` · `RL-20260409-002` · `RL-20260423-002` · `RL-20260506-006`

**📜 Rule**\
Assertions and fixtures must fail loudly when the behavior or fixture data they rely on disappears.

**✅ Check**\

> Did this add or update a test assertion? If yes, would it fail if the bug reappeared or fixture data vanished?

<details>
<summary><strong>💡 Example 1 of 3</strong> — <code>examples/general/testing.md</code> § <em>negative-assertions</em></summary>

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
<summary><strong>💡 Example 2 of 3</strong> — <code>examples/general/testing.md</code> § <em>test-01-assert-the-specific-behavior-the-description-claims</em></summary>

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
<summary><strong>💡 Example 3 of 3</strong> — <code>examples/general/testing.md</code> § <em>test-01-mock-external-lookups-instead-of-relying-on-real-fixture-state</em></summary>

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

---

<a id="test-02"></a>

### `TEST-02` New branch logic needs branch-specific tests

> **general** · testing · 1 example · ↩ `RL-20260324-001` · `RL-20260327-004` · `RL-20260407-001` · `RL-20260417-001` · `RL-20260420-002` · `RL-20260428-002` · `RL-20260429-001` · `RL-20260430-001` · `RL-20260430-002` · `RL-20260504-001` · `RL-20260505-002` · `RL-20260505-006` · `RL-20260506-002`

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

> **general** · testing · 1 example · ↩ `RL-20260413-007`

**📜 Rule**\
When a hook/component only forwards data into a pure conversion helper, test the conversion helper output directly and keep orchestration tests focused on forwarding behavior.

**✅ Check**\

> Did this add conversion logic plus a caller? If yes, are transformation tests separate from orchestration tests?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/testing.md</code> § <em>conversion-vs-orchestration</em></summary>

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

> **web** · ui · ↩ `RL-20260506-001`

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

> **web** · observability · ↩ `RL-20260417-003`

**📜 Rule**\
Observability changes should distinguish warning-level noise from user-impacting errors and avoid flooding SLOs with expected retries, browser noise, or duplicate signals.

**✅ Check**\

> Did this change logging/RUM/error classification? If yes, is the level justified by user impact and duplication risk?

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

> **general** · ci · ↩ `RL-20260326-003` · `RL-20260407-002` · `RL-20260422-001`

**📜 Rule**\
CI concurrency groups and generated deployment labels must include the branch/ref and any static suffixes that affect the real limit.

**✅ Check**\

> Did this add or edit workflow concurrency, preview URLs, or DNS labels? If yes, is the real full label/ref scoped correctly?

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

> **general** · docs · ↩ `RL-20260408-003` · `RL-20260430-003`

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

> **web** · navigation · 1 example · ↩ `RL-20260402-001` · `RL-20260410-003` · `RL-20260429-002`

**📜 Rule**\
Safe-scoped CTAs and route builders must use the loaded Safe source of truth and block unavailable flows for undeployed Safes instead of trusting optional query params.

**✅ Check**\

> Did this add a Safe-scoped link, CTA, or router push? If yes, does it use loaded Safe state and gate undeployed-Safe blocked routes?

<details>
<summary><strong>💡 Example</strong> — <code>web/examples/feature-boundaries.md</code> § <em>web-04-reusable-onboarding-components-must-not-hard-code-back-navigation</em></summary>

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

---

## 🌐 mobile › navigation

<a id="mob-04"></a>

### `MOB-04` Keep Expo router layouts structural

> **mobile** · navigation · ↩ `RL-20260331-001`

**📜 Rule**\
Expo Router layout files should define shell/navigation structure; business cleanup, disconnect, validation, and navigation side effects belong in focused containers, hooks, or screen logic.

**✅ Check**\

> Did this add logic to an Expo Router `_layout.tsx` file? If yes, is it only structural shell code?

---

## 🌐 web › auth

<a id="web-05"></a>

### `WEB-05` Sanitize auth redirects and outcomes

> **web** · auth · 1 example · ↩ `RL-20260325-001` · `RL-20260407-003`

**📜 Rule**\
Auth redirect URLs must remove transient error/query state and validate externally supplied return targets before sending users through OIDC or callback flows.

**✅ Check**\

> Did this add or change an auth redirect or callback? If yes, is the return URL sanitized and validated?

<details>
<summary><strong>💡 Example</strong> — <code>examples/general/gateway-hooks.md</code> § <em>web-05-trigger-redirect-endpoints-via-top-level-navigation</em></summary>

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

---

## 🌐 web › features

<a id="feat-03"></a>

### `FEAT-03` Do not self-import feature barrels

> **web** · features · 1 example · ↩ `RL-20260326-001`

**📜 Rule**\
Code inside a web feature must not import the feature barrel or lazy feature handle when a direct hook, constant, or feature flag check avoids a circular dependency.

**✅ Check**\

> Did this code inside `features/<name>` import from that feature barrel? If yes, can it import the direct module or shared hook instead?

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

## 🌐 general › ui

<a id="ui-01"></a>

### `UI-01` Use theme tokens and hosted assets

> **general** · ui · ↩ `RL-20260327-003` · `RL-20260327-005`

**📜 Rule**\
UI colors and reusable assets should use theme variables/tokens and hosted files instead of hardcoded hex values or embedded base64 data.

**✅ Check**\

> Did this add colors, icons, or image assets? If yes, are they theme-backed or hosted rather than hardcoded/embedded?

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

> **mobile** · providers · ↩ `RL-20260327-002` · `RL-20260327-003`

**📜 Rule**\
Mobile wallet/provider integrations should sit low enough in the provider tree to read store/config state, use supported network/config sources, and avoid bundle-heavy embedded assets.

**✅ Check**\

> Did this add or move a mobile provider or wallet integration? If yes, can it read store/config state and avoid hardcoded networks or embedded assets?

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

> **web** · ui · ↩ `RL-20260410-004`

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
