# Feature Boundaries

Use these examples when adding web features or wiring one feature into another.

## feature-public-api

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

## shared-form-components

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

## repeated-style-shape

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

## multichain-compatibility-state

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

## CODE-01 — Fold near-duplicate sign-in buttons into one configurable component

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

## CODE-01 — Extract embedded error boundaries from unrelated UI components

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

## UX-02 — Hide server-backed actions on local-only rows

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

## WEB-04 — Reusable onboarding components must not hard-code Back navigation

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
