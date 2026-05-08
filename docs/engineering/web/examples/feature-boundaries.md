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

## CODE-02 — Move heavy Tailwind class strings into CSS modules

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

## Consolidate per-element Tailwind into the CSS module class

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

## Theme a static logo via CSS mask, not bundled SVG

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

## Branch the action, do not duplicate the match

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

## Hoist derived values out of JSX

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

## Place feature subfolders next to their consumers

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

## Use relative imports inside a feature; export only the public surface

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

## Validate Safe App URLs before postMessage origin checks

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

## Sibling files inside a feature use relative imports

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

## Prefix-match pathname against route, not the reverse

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
